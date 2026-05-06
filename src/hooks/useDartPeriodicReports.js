import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  dartListPath,
  fetchDartListAllPages,
  mapDartReportRowToCalendarEvent,
  isDartProvisionalEarningsRow,
  getMonthRangeYmd8,
  buildDartListQuery,
} from '../utils/opendartIpoApi';

const STREAMS = [
  {
    key: 'annual',
    pblntf_ty: 'A',
    pblntf_detail_ty: 'A001',
    kindLabel: '사업보고서',
  },
  {
    key: 'quarterly',
    pblntf_ty: 'A',
    pblntf_detail_ty: 'A003',
    kindLabel: '분기보고서',
  },
  {
    key: 'provisional',
    pblntf_ty: 'I',
    pblntf_detail_ty: 'I001',
    kindLabel: '잠정실적',
    filterRow: isDartProvisionalEarningsRow,
  },
];

function periodicMaxPages() {
  const periodic = Number(import.meta.env.VITE_DART_PERIODIC_MAX_PAGES);
  if (Number.isFinite(periodic) && periodic >= 1) {
    return Math.min(Math.floor(periodic), 35);
  }
  const dartMax = Number(import.meta.env.VITE_DART_FETCH_MAX_PAGES);
  if (Number.isFinite(dartMax) && dartMax >= 1) {
    return Math.min(Math.floor(dartMax), 35);
  }
  return 25;
}

/**
 * Open DART — 국내기업 사업보고서(A001)·분기보고서(A003)·잠정실적(I001 중 제목 필터)
 * 공모주(list C001)와 별도 플래그.
 *
 * @param {boolean} enabled
 * @param {{ start: Date, end: Date }|null} viewRange
 */
export function useDartPeriodicReports(enabled, viewRange) {
  const [rawEvents, setRawEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  const fetchAll = useCallback(async () => {
    const { keyPresent } = buildDartListQuery(
      viewRange?.start || new Date(),
      viewRange?.end || new Date(),
    );
    if (!keyPresent) {
      setRawEvents([]);
      setFetchError('DART API 인증키가 없습니다. VITE_DART_CRTFC_KEY 를 .env 에 넣어 주세요.');
      return;
    }
    if (!viewRange?.start || !viewRange?.end) {
      setRawEvents([]);
      setFetchError(null);
      return;
    }

    setLoading(true);
    setFetchError(null);
    try {
      const ymd = getMonthRangeYmd8(viewRange.start, viewRange.end);
      const maxPages = periodicMaxPages();
      const errors = [];

      const settled = await Promise.all(
        STREAMS.map(async (spec) => {
          const { items, error } = await fetchDartListAllPages(
            dartListPath(),
            ymd,
            maxPages,
            fetch,
            { pblntf_ty: spec.pblntf_ty, pblntf_detail_ty: spec.pblntf_detail_ty },
          );
          if (error) {
            errors.push(`${spec.kindLabel}: ${error}`);
            return [];
          }
          const rows = spec.filterRow ? items.filter(spec.filterRow) : items;
          return rows
            .map((row, i) => mapDartReportRowToCalendarEvent(row, i, { kindLabel: spec.kindLabel }))
            .filter(Boolean);
        }),
      );

      const merged = settled.flat();
      const seen = new Set();
      const deduped = merged.filter((ev) => {
        if (seen.has(ev.id)) return false;
        seen.add(ev.id);
        return true;
      });

      setRawEvents(deduped);
      if (errors.length === STREAMS.length) {
        setFetchError(errors.join(' · '));
      } else if (errors.length > 0) {
        setFetchError(`일부 구간만 불러왔습니다. ${errors.join(' · ')}`);
      }
    } catch (e) {
      const msg = e?.message || String(e);
      if (msg.toLowerCase().includes('network') || msg.toLowerCase().includes('failed') || msg.toLowerCase().includes('cors')) {
        setFetchError('CORS(배포): opendart 직접 호출이 막혔을 수 있습니다. VITE_DART_OPENDART_ORIGIN(프록시 URL)과 VITE_DART_CRTFC_KEY 를 확인하세요.');
      } else {
        setFetchError(msg);
      }
      setRawEvents([]);
    } finally {
      setLoading(false);
    }
  }, [viewRange]);

  useEffect(() => {
    if (!enabled) {
      setRawEvents([]);
      setFetchError(null);
      return;
    }
    void fetchAll();
  }, [enabled, fetchAll]);

  const events = useMemo(() => {
    if (!enabled || !viewRange?.start || !viewRange?.end) return rawEvents;
    const s = viewRange.start.getTime();
    const e = viewRange.end.getTime();
    return rawEvents.filter((ev) => {
      const t = new Date(ev.starts_at).getTime();
      return t >= s - 86400000 && t <= e + 86400000;
    });
  }, [rawEvents, viewRange, enabled]);

  return { events, loading, error: enabled ? fetchError : null, refetch: fetchAll };
}
