import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { readSupabaseFunctionErrorMessage } from '../utils/readSupabaseFunctionError';

const KR_MACRO_FLAG = '🇰🇷';

/** 캘린더·헤더용: '한국 GDP…' → 'GDP…' */
function stripKrLabelPrefix(label) {
  const s = String(label || '').trim();
  if (!s) return '';
  return s.replace(/^한국\s*/u, '').trim() || s;
}

/**
 * 연·월·분기 등 시점 접두부를 `'본문 · 2026년 5월'` 형태로 뒤로 이동
 */
function moveBokTemporalToEnd(raw) {
  const t = String(raw || '').trim();
  if (!t) return t;
  const periodAlt = [
    '\\d/\\d분기',
    '\\d{1,2}월',
    '상반기',
    '하반기',
    '\\d분기',
  ].join('|');
  const re = new RegExp(`^(\\d{4}년)(?:\\s+(${periodAlt}))?\\s+([\\s\\S]+)$`, 'u');
  const m = t.match(re);
  if (!m?.[3]) return t;
  const [, yr, period, body] = m;
  const b = body.trim();
  if (!b) return t;
  if (!period && /^\d/.test(b)) return t;
  const tailPart = period ? `${yr.trim()} ${period.trim()}`.trim() : yr.trim();
  return `${b} · ${tailPart}`;
}

function toYmd(d) {
  if (!d) return '';
  const x = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(x.getTime())) return '';
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, '0');
  const day = String(x.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Edge Function JSON 본문의 data.error 를 사용자 안내 문장으로 */
function formatBokFunctionBodyError(data) {
  if (!data || typeof data !== 'object') return null;
  const err = data.error;
  if (err == null) return null;
  const hint = typeof data.hint === 'string' ? data.hint.trim() : '';
  if (err === 'missing_bok_ecos_key') {
    return '한국은행 일정: Edge Function에 BOK_ECOS_API_KEY(한국은행 ECOS 인증키) 시크릿이 없습니다. Supabase → Project Settings → Edge Functions → Secrets에 추가한 뒤 fetch-bok-releases를 다시 배포해 주세요.';
  }
  if (hint) return `${String(err)} — ${hint}`;
  return String(err);
}

/** invoke 단계 HTTP 오류 메시지 보강 */
function enrichBokInvokeHttpMessage(msg) {
  const m = String(msg);
  if (/non-2xx/i.test(m) && !m.includes('—')) {
    return `${m} Supabase 대시보드에서 Edge Function「fetch-bok-releases」배포 여부·실행 로그·시크릿(BOK_ECOS_API_KEY)을 확인해 주세요.(404면 함수 미배포)`;
  }
  return m;
}

function mapBokRowToCalendarEvent(row) {
  const ymd = row.release_date;
  const rawCalendarTitle = String(row.title || '').trim();
  const start = `${ymd}T00:00:00`;
  const endDt = new Date(`${ymd}T12:00:00`);
  endDt.setHours(23, 59, 59, 999);
  const line = moveBokTemporalToEnd(
    stripKrLabelPrefix(String(row.title || '').trim())
      || stripKrLabelPrefix(row.category_label || ''),
  ) || '한국은행 통계';
  const title = line;

  return {
    id: `bok-${row.category_code || 'release'}-${ymd}-${String(row.title || '').slice(0, 40)}`,
    title,
    starts_at: start,
    ends_at: endDt.toISOString(),
    is_all_day: true,
    color: '#0d47a1',
    _external: 'bok',
    _fredRow: {
      ...row,
      title: line,
      raw_calendar_title: rawCalendarTitle,
      series_id: row.category_code || 'BOK',
      source_name: row.source_name || '한국은행',
      calendar_url: row.calendar_url ?? row.source_url,
      indicator_url:
        row.indicator_url
        || (row.ecos_stat_code ? `https://ecos.bok.or.kr/#/SearchStat/${row.ecos_stat_code}` : undefined),
      indicator_label: row.indicator_label || 'ECOS 통계표·시계열',
      regionFlag: KR_MACRO_FLAG,
    },
    creator_id: '__bok__',
    event_visibility: [],
  };
}

const CACHE_PREFIX = 'moneycal.bokReleases.v1';
const CACHE_TTL_MS = 1000 * 60 * 60 * 6; /** 6시간 — 공표일정은 자주 바뀌지 않음 */

function readBokCache(start, end) {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const key = `${CACHE_PREFIX}:${start}:${end}`;
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const o = JSON.parse(raw);
    if (!o || typeof o.t !== 'number' || Date.now() - o.t > CACHE_TTL_MS) return null;
    return o;
  } catch {
    return null;
  }
}

function writeBokCache(start, end, payload) {
  try {
    const key = `${CACHE_PREFIX}:${start}:${end}`;
    sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), ...payload }));
  } catch {
    /* 할당량 등 */
  }
}

/**
 * 한국은행 통계공표일정 → 캘린더용 이벤트
 * 일정 출처: 한국은행 월간통계 공표일정, 상세 링크: 한국은행/ECOS 공식 페이지
 * @param {boolean} enabled
 * @param {{ start: Date, end: Date }|null} viewRange
 */
export function useBokEconomicEvents(enabled, viewRange) {
  const [rawRows, setRawRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  const runFetch = useCallback(async (opts = {}) => {
    const bypassCache = opts.bypassCache === true;
    if (!viewRange?.start || !viewRange?.end) {
      setRawRows([]);
      setFetchError(null);
      return;
    }

    const pad = (d, days) => {
      const x = new Date(d);
      x.setDate(x.getDate() + days);
      return toYmd(x);
    };
    const start = pad(viewRange.start, -3);
    const end = pad(viewRange.end, 5);

    if (!bypassCache) {
      const cached = readBokCache(start, end);
      if (cached && Array.isArray(cached.releases)) {
        setRawRows(cached.releases);
        setFetchError(null);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setFetchError(null);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-bok-releases', {
        body: { start, end },
      });
      if (error) {
        const detail = await readSupabaseFunctionErrorMessage(error);
        setFetchError(enrichBokInvokeHttpMessage(detail));
        setRawRows([]);
        return;
      }
      if (data && typeof data === 'object' && data.error) {
        setFetchError(formatBokFunctionBodyError(data) || String(data.error));
        setRawRows([]);
        return;
      }
      const releases = Array.isArray(data?.releases) ? data.releases : [];
      setRawRows(releases);
      writeBokCache(start, end, { releases });
    } catch (e) {
      setFetchError(e?.message || String(e));
      setRawRows([]);
    } finally {
      setLoading(false);
    }
  }, [viewRange]);

  useEffect(() => {
    if (!enabled) {
      setRawRows([]);
      setFetchError(null);
      setLoading(false);
      return;
    }
    /** 달력 뷰 전환 시 datesSet이 연속으로 올 수 있어 한 번만 요청하도록 묶음 */
    const t = setTimeout(() => {
      void runFetch({});
    }, 200);
    return () => clearTimeout(t);
  }, [enabled, runFetch]);

  const events = useMemo(() => {
    if (!enabled) return [];
    return (rawRows || []).map(mapBokRowToCalendarEvent);
  }, [rawRows, enabled]);

  return {
    events,
    loading,
    error: enabled ? fetchError : null,
    refetch: () => runFetch({ bypassCache: true }),
  };
}
