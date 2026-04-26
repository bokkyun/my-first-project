import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  dartListPath,
  fetchDartListAllPages,
  mapDartListItemToCalendarEvent,
  getMonthRangeYmd8,
  buildDartListQuery,
} from '../utils/opendartIpoApi';

/**
 * Open DART 공시(공모·지분증권 C001 등) → 캘린더 이벤트
 * @param {boolean} enabled
 * @param {{ start: Date, end: Date }|null} viewRange
 */
export function useDartIpoEvents(enabled, viewRange) {
  const [rawEvents, setRawEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  const fetchList = useCallback(async () => {
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
      const { items, error } = await fetchDartListAllPages(dartListPath(), ymd, 25);
      if (error) {
        setFetchError(error);
        setRawEvents([]);
        return;
      }
      const seen = new Set();
      const mapped = (items || [])
        .map((it, i) => mapDartListItemToCalendarEvent(it, i))
        .filter(Boolean)
        .filter((ev) => {
          if (seen.has(ev.id)) return false;
          seen.add(ev.id);
          return true;
        });
      setRawEvents(mapped);
    } catch (e) {
      const msg = e?.message || String(e);
      if (msg.toLowerCase().includes('network') || msg.toLowerCase().includes('failed') || msg.toLowerCase().includes('cors')) {
        setFetchError('네트워크/CORS: 개발(npm run dev)에서는 Vite 프록시(__opendart_proxy)를 쓰고, 배포 시에는 DART 서버가 브라우저 직접 호출을 막을 수 있어 백엔드/동일 출처 프록시가 필요할 수 있습니다.');
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
    void fetchList();
  }, [enabled, fetchList]);

  const events = useMemo(() => {
    if (!enabled || !viewRange?.start || !viewRange?.end) return rawEvents;
    const s = viewRange.start.getTime();
    const e = viewRange.end.getTime();
    return rawEvents.filter((ev) => {
      const t = new Date(ev.starts_at).getTime();
      return t >= s - 86400000 && t <= e + 86400000;
    });
  }, [rawEvents, viewRange, enabled]);

  return { events, loading, error: enabled ? fetchError : null, refetch: fetchList };
}
