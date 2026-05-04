import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';

const KR_MACRO_FLAG = '🇰🇷';

/** 캘린더·헤더용: '한국 GDP…' → 'GDP…' */
function stripKrLabelPrefix(label) {
  const s = String(label || '').trim();
  if (!s) return '';
  return s.replace(/^한국\s*/u, '').trim() || s;
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

function mapBokRowToCalendarEvent(row) {
  const ymd = row.release_date;
  const start = `${ymd}T00:00:00`;
  const endDt = new Date(`${ymd}T12:00:00`);
  endDt.setHours(23, 59, 59, 999);
  const line = stripKrLabelPrefix(String(row.title || '').trim())
    || stripKrLabelPrefix(row.category_label || '')
    || '한국은행 통계';
  const title = `📅 ${line} ${KR_MACRO_FLAG}`;

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
      series_id: row.category_code || 'BOK',
      source_name: row.source_name || '한국은행',
      source_label: row.source_label || '한국은행 공표일정 보기',
      source_url: row.source_url || 'https://ecos.bok.or.kr/',
      regionFlag: KR_MACRO_FLAG,
    },
    creator_id: '__bok__',
    event_visibility: [],
  };
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

  const fetchRows = useCallback(async () => {
    if (!viewRange?.start || !viewRange?.end) {
      setRawRows([]);
      setFetchError(null);
      return;
    }

    setLoading(true);
    setFetchError(null);
    try {
      const pad = (d, days) => {
        const x = new Date(d);
        x.setDate(x.getDate() + days);
        return toYmd(x);
      };
      const { data, error } = await supabase.functions.invoke('fetch-bok-releases', {
        body: {
          start: pad(viewRange.start, -3),
          end: pad(viewRange.end, 5),
        },
      });
      if (error) {
        setFetchError(error.message || String(error));
        setRawRows([]);
        return;
      }
      if (data && typeof data === 'object' && data.error) {
        setFetchError(String(data.error));
        setRawRows([]);
        return;
      }
      setRawRows(Array.isArray(data?.releases) ? data.releases : []);
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
      return;
    }
    void fetchRows();
  }, [enabled, fetchRows]);

  const events = useMemo(() => {
    if (!enabled) return [];
    return (rawRows || []).map(mapBokRowToCalendarEvent);
  }, [rawRows, enabled]);

  return {
    events,
    loading,
    error: enabled ? fetchError : null,
    refetch: fetchRows,
  };
}
