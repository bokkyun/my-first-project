import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  buildRebAptSplyListUrl,
  toDataGoAbsoluteUrl,
  parseRebAptSplyResponse,
  mapSplyItemToCalendarEvent,
} from '../utils/rebAptSplyApi';

/**
 * 청약홈 분양정보 API → 캘린더용 이벤트 (로컬 구간으로 필터)
 * @param {boolean} enabled
 * @param {{ start: Date, end: Date }|null} viewRange
 */
export function useRebAptSplyEvents(enabled, viewRange) {
  const [rawEvents, setRawEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  const fetchList = useCallback(async () => {
    const { path, query, keyPresent } = buildRebAptSplyListUrl();
    if (!keyPresent) {
      setRawEvents([]);
      setFetchError('서비스 키가 없습니다. .env에 VITE_DATA_GO_KR_SERVICE_KEY 를 설정하세요.');
      return;
    }
    if (!path) {
      setFetchError('API 경로가 없습니다. VITE_REB_APT_SPLY_PATH 를 확인하세요.');
      return;
    }
    setLoading(true);
    setFetchError(null);
    try {
      const url = toDataGoAbsoluteUrl(path, query ? `?${query}` : '');
      const res = await fetch(url, { method: 'GET' });
      if (!res.ok) {
        setFetchError(`HTTP ${res.status}`);
        setRawEvents([]);
        return;
      }
      const json = await res.json();
      const { items, error } = parseRebAptSplyResponse(json);
      if (error) {
        setFetchError(error);
        setRawEvents([]);
        return;
      }
      const mapped = (items || [])
        .map((it, i) => mapSplyItemToCalendarEvent(it, i))
        .filter(Boolean);
      setRawEvents(mapped);
    } catch (e) {
      const msg = e?.message || String(e);
      if (msg.toLowerCase().includes('network') || msg.toLowerCase().includes('load failed') || msg.toLowerCase().includes('cors')) {
        setFetchError('네트워크/CORS: 배포 사이트에서는 data.go.kr 직접 호출이 막힐 수 있습니다. 개발(npm run dev)에서는 Vite 프록시를 쓰거나, 동일 출처 API 프록시를 두세요.');
      } else {
        setFetchError(msg);
      }
      setRawEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

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
      const st = new Date(ev.starts_at).getTime();
      return st >= s - 86400000 && st <= e + 86400000;
    });
  }, [rawEvents, viewRange, enabled]);

  return { events, loading, error: enabled ? fetchError : null, refetch: fetchList };
}
