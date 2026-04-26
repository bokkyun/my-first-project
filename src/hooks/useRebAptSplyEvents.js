import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  buildRebAptSplyListUrl,
  toRebAptAbsoluteUrl,
  parseRebAptSplyResponse,
  mapRebAptItemToCalendarEvent,
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
    const { path, query, keyPresent, mode } = buildRebAptSplyListUrl();
    if (!keyPresent) {
      setRawEvents([]);
      setFetchError('인증키가 없습니다. 공공데이터포털에서 발급한 키를 .env 의 VITE_DATA_GO_KR_SERVICE_KEY 에 넣어 주세요.');
      return;
    }
    if (!path) {
      setFetchError(
        mode === 'odcloud'
          ? 'API 경로가 없습니다. VITE_REB_APT_ODCLOUD_PATH 를 확인하세요.'
          : 'API 경로가 없습니다. VITE_REB_APT_SPLY_PATH 를 확인하세요.',
      );
      return;
    }
    setLoading(true);
    setFetchError(null);
    try {
      const url = toRebAptAbsoluteUrl(path, query ? `?${query}` : '', mode);
      const res = await fetch(url, { method: 'GET' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = json?.msg || json?.message;
        setFetchError(msg ? `HTTP ${res.status}: ${msg}` : `HTTP ${res.status}`);
        setRawEvents([]);
        return;
      }
      const { items, error } = parseRebAptSplyResponse(json);
      if (error) {
        setFetchError(error);
        setRawEvents([]);
        return;
      }
      const mapped = (items || [])
        .map((it, i) => mapRebAptItemToCalendarEvent(it, i, mode))
        .filter(Boolean);
      setRawEvents(mapped);
    } catch (e) {
      const msg = e?.message || String(e);
      if (msg.toLowerCase().includes('network') || msg.toLowerCase().includes('load failed') || msg.toLowerCase().includes('cors')) {
        setFetchError('네트워크/CORS: 개발(npm run dev)에서는 Vite 프록시(__odcloud_proxy / __public_data_go_proxy)를 쓰고, 배포 시에는 CORS·프록시 또는 origin 환경 변수를 맞춰 주세요.');
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
