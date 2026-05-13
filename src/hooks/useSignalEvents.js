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
    return { start, end };
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
