import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';

const TRACKED_FRED_SERIES = new Set(['PAYEMS', 'CPIAUCSL', 'DFEDTARU', 'GDPC1', 'UNRATE']);

function toYmd(d) {
  if (!d) return '';
  const x = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(x.getTime())) return '';
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, '0');
  const day = String(x.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function mapFredRowToCalendarEvent(row) {
  const ymd = row.release_date;
  const start = `${ymd}T00:00:00`;
  const endDt = new Date(`${ymd}T12:00:00`);
  endDt.setHours(23, 59, 59, 999);
  const hasVal = row.actual_value != null && String(row.actual_value).trim() !== '';
  const title = hasVal
    ? `📊 ${row.title}: ${row.actual_value}`
    : `📅 ${row.title} (발표예정)`;
  return {
    id: `fred-${row.id}`,
    title,
    starts_at: start,
    ends_at: endDt.toISOString(),
    is_all_day: true,
    color: '#6a1b9a',
    _external: 'fred',
    _fredRow: row,
    creator_id: '__fred__',
    event_visibility: [],
  };
}

/**
 * Supabase fred_economic_releases → 캘린더 이벤트
 * 데이터 적재: Edge Function sync-fred-releases (FRED API)
 * @param {boolean} enabled
 * @param {{ start: Date, end: Date }|null} viewRange
 * @param {string|null} userId — 비로그인 시 조회 안 함(RLS)
 */
export function useFredEconomicEvents(enabled, viewRange, userId) {
  const [rawRows, setRawRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  const fetchRows = useCallback(async () => {
    if (!userId || !viewRange?.start || !viewRange?.end) {
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
      const from = pad(viewRange.start, -3);
      const to = pad(viewRange.end, 5);
      const { data, error } = await supabase
        .from('fred_economic_releases')
        .select('*')
        .gte('release_date', from)
        .lte('release_date', to)
        .order('release_date', { ascending: true });
      if (error) {
        const code = error.code || '';
        const hint = code === 'PGRST116' || error.message?.includes('does not exist')
          ? ' Supabase에 마이그레이션(supabase/migrations/…fred…) 적용 여부를 확인하세요.'
          : '';
        setFetchError(`${error.message || String(error)}${hint}`);
        setRawRows([]);
        return;
      }
      setRawRows(data || []);
    } catch (e) {
      setFetchError(e?.message || String(e));
      setRawRows([]);
    } finally {
      setLoading(false);
    }
  }, [userId, viewRange]);

  useEffect(() => {
    if (!enabled || !userId) {
      setRawRows([]);
      setFetchError(null);
      return;
    }
    void fetchRows();
  }, [enabled, userId, fetchRows]);

  const events = useMemo(() => {
    if (!enabled) return [];
    return (rawRows || [])
      .filter((row) => TRACKED_FRED_SERIES.has(row.series_id))
      .map(mapFredRowToCalendarEvent);
  }, [rawRows, enabled]);

  const syncFromFred = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { error: new Error('로그인이 필요합니다.') };
    const { data, error } = await supabase.functions.invoke('sync-fred-releases', { body: {} });
    if (error) return { error };
    if (data && typeof data === 'object' && data.error) {
      return { error: new Error(String(data.error)) };
    }
    await fetchRows();
    return { data };
  }, [fetchRows]);

  return {
    events,
    loading,
    error: enabled ? fetchError : null,
    refetch: fetchRows,
    syncFromFred,
  };
}
