import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  buildRebAptSplyListUrl,
  toRebAptAbsoluteUrl,
  parseRebAptSplyResponse,
  mapRebAptItemToCalendarEvent,
  filterOdcloudItemsCalendarRelevant,
  getRebAptOdcloudPageSizeNum,
  getRebAptOdcloudMaxPagesNum,
  getRebAptOdcloudFetchPaths,
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
    if (mode === 'odcloud') {
      if (!getRebAptOdcloudFetchPaths().length) {
        setFetchError('API 경로가 없습니다. VITE_REB_APT_ODCLOUD_PATH 를 확인하세요.');
        return;
      }
    } else if (!path) {
      setFetchError('API 경로가 없습니다. VITE_REB_APT_SPLY_PATH 를 확인하세요.');
      return;
    }
    setLoading(true);
    setFetchError(null);
    try {
      const perPage = getRebAptOdcloudPageSizeNum();
      const maxPages = mode === 'odcloud' ? getRebAptOdcloudMaxPagesNum() : 1;
      const odPaths = mode === 'odcloud' ? getRebAptOdcloudFetchPaths() : [undefined];

      const fetchPage = async (pg, odPath) => {
        const { path: pPath, query: pQuery } = buildRebAptSplyListUrl(pg, odPath);
        const url = toRebAptAbsoluteUrl(pPath, pQuery ? `?${pQuery}` : '', mode);
        const res = await fetch(url, { method: 'GET' });
        const json = await res.json().catch(() => ({}));
        return { pg, res, json };
      };

      /** odcloud: getAPTLttot… + getRemndrLttot…(무순위·잔여) 병합. 각 경로마다 1페이지 먼저 → 가득 차면 추가 페이지 병렬 */
      const merged = [];
      for (const odPath of odPaths) {
        const first = await fetchPage(1, odPath);
        if (!first.res.ok) {
          const msg = first.json?.msg || first.json?.message;
          setFetchError(msg ? `HTTP ${first.res.status}: ${msg}` : `HTTP ${first.res.status}`);
          setRawEvents([]);
          return;
        }
        const parsed1 = parseRebAptSplyResponse(first.json);
        if (parsed1.error) {
          setFetchError(parsed1.error);
          setRawEvents([]);
          return;
        }
        const batch1 = parsed1.items || [];
        merged.push(...batch1);

        if (mode === 'odcloud' && maxPages > 1 && batch1.length >= perPage) {
          const extra = [];
          for (let pg = 2; pg <= maxPages; pg += 1) extra.push(pg);
          const more = await Promise.all(extra.map((pg) => fetchPage(pg, odPath)));
          for (const { res, json } of more) {
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
            merged.push(...(items || []));
          }
        }
      }

      let list = merged;
      if (mode === 'odcloud') {
        const seen = new Set();
        list = merged.filter((row) => {
          const k = [row.HOUSE_MGMT_NO, row.HSMP_MGMT_NO, row.PBLANC_NO, row.RCEPT_ENDDE, row.HSMP_NM]
            .map((x) => String(x ?? ''))
            .join('\u0001');
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        });
        const lookbackRaw = import.meta.env.VITE_REB_ODCLOUD_LOOKBACK_DAYS;
        const lookbackNum = lookbackRaw != null && String(lookbackRaw).trim() !== ''
          ? Number(lookbackRaw)
          : 120;
        list = filterOdcloudItemsCalendarRelevant(
          list,
          Number.isFinite(lookbackNum) ? lookbackNum : 120,
        );
      }
      const mapped = list
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
