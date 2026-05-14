import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

function toYmd(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** FullCalendar datesSet 의 end 는 배타적이므로, lte 쿼리용 마지막 포함일(로컬 달력 기준) */
function exclusiveEndToInclusiveLastYmd(exclusiveEnd) {
  if (!(exclusiveEnd instanceof Date) || Number.isNaN(exclusiveEnd.getTime())) return null;
  const last = new Date(exclusiveEnd.getTime() - 1);
  return toYmd(last);
}

function addDaysToYmd(ymd, deltaDays) {
  if (!ymd || typeof ymd !== 'string') return ymd;
  const parts = ymd.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return ymd;
  const [y, m, d] = parts;
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + deltaDays);
  return toYmd(dt);
}

/** YYYY-MM-DD 두 끝(포함) 사이 일 수 */
function spanDaysInclusive(startYmd, endYmd) {
  if (!startYmd || !endYmd) return 0;
  const partsS = startYmd.split('-').map(Number);
  const partsE = endYmd.split('-').map(Number);
  if (partsS.length !== 3 || partsE.length !== 3) return 0;
  const [y1, m1, d1] = partsS;
  const [y2, m2, d2] = partsE;
  const t1 = new Date(y1, m1 - 1, d1).getTime();
  const t2 = new Date(y2, m2 - 1, d2).getTime();
  if (Number.isNaN(t1) || Number.isNaN(t2)) return 0;
  return Math.round((t2 - t1) / 86400000) + 1;
}

/**
 * 주·일 뷰처럼 화면에 잡힌 기간이 짧을 때 시그널만 너무 좁게 조회되는 것을 막기 위해
 * 최소 일수(기본 42일)가 되도록 앞뒤로 늘린 조회 구간.
 */
function widenSignalQueryYmdRange(startYmd, endYmd, minSpanDays = 42) {
  if (!startYmd || !endYmd) return { start: startYmd, end: endYmd };
  const span = spanDaysInclusive(startYmd, endYmd);
  if (span >= minSpanDays) return { start: startYmd, end: endYmd };
  const pad = Math.ceil((minSpanDays - span) / 2);
  return {
    start: addDaysToYmd(startYmd, -pad),
    end: addDaysToYmd(endYmd, pad),
  };
}

function categoryColor(category) {
  if (category === '추세') return '#1976d2';
  if (category === '모멘텀') return '#2e7d32';
  if (category === '볼린저') return '#6a1b9a';
  return '#455a64';
}

/**
 * signals 테이블 데이터를 캘린더 이벤트 형식으로 변환해 제공합니다.
 * 각 시그널은 해당 날짜 16:00~16:30 일정으로 렌더링됩니다.
 */
export function useSignalEvents(enabled, viewRange, enabledSignalTypes = []) {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);

  const range = useMemo(() => {
    const start = toYmd(viewRange?.start);
    const endFromExclusive = exclusiveEndToInclusiveLastYmd(viewRange?.end);
    const endFallback = toYmd(viewRange?.end);
    const end = endFromExclusive || endFallback;
    if (!start || !end) return { start, end };
    return widenSignalQueryYmdRange(start, end);
  }, [viewRange?.start, viewRange?.end]);

  const enabledTypesKey = useMemo(
    () => [...enabledSignalTypes].sort().join('|'),
    [enabledSignalTypes],
  );

  useEffect(() => {
    let active = true;

    async function run() {
      if (!enabled || !range.start || !range.end) {
        if (active) {
          setEvents([]);
          setError(null);
        }
        return;
      }

      let q = supabase
        .from('signals')
        .select('date, code, name, market, signal_type, signal_category, signal_name')
        .gte('date', range.start)
        .lte('date', range.end);

      if (enabledSignalTypes.length > 0) {
        q = q.in('signal_type', enabledSignalTypes);
      }

      const { data, error: fetchError } = await q;

      if (!active) return;

      if (fetchError) {
        setEvents([]);
        setError(fetchError.message || String(fetchError));
        return;
      }

      const mapped = (data || []).map((row) => ({
        id: `signal-${row.date}-${row.code}-${row.signal_type}`,
        title: `[${row.signal_category || '시그널'}] ${row.name || row.code} ${row.signal_name || row.signal_type}`,
        starts_at: `${row.date}T16:00:00+09:00`,
        ends_at: `${row.date}T16:30:00+09:00`,
        is_all_day: false,
        color: categoryColor(row.signal_category),
        _external: 'signal',
        _signalRow: row,
      }));

      setEvents(mapped);
      setError(null);
    }

    void run();

    return () => {
      active = false;
    };
  }, [enabled, range.start, range.end, enabledTypesKey]);

  return { events, error };
}
