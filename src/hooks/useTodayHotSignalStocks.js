import { useEffect, useState } from 'react';
import {
  fetchSignalsForDateRange,
  isSpacSignalRow,
  SIGNAL_POLL_INTERVAL_MS,
  toYmd,
} from './useSignalEvents';

const DEFAULT_MIN_SIGNAL_COUNT = 3;
const DEFAULT_LIMIT = 8;

export function buildHotSignalStocks(rows, minSignalCount = DEFAULT_MIN_SIGNAL_COUNT, limit = DEFAULT_LIMIT) {
  const byStock = new Map();

  for (const row of rows || []) {
    if (isSpacSignalRow(row)) continue;

    const code = String(row.code ?? '').trim();
    const name = String(row.name ?? '').trim();
    const stockKey = code || `name:${name}`;
    const signalType = String(row.signal_type ?? '').trim();
    if (!stockKey || !signalType) continue;

    if (!byStock.has(stockKey)) {
      byStock.set(stockKey, {
        code,
        name,
        market: row.market || '',
        signalTypes: new Map(),
      });
    }

    const stock = byStock.get(stockKey);
    if (!stock.signalTypes.has(signalType)) {
      stock.signalTypes.set(signalType, {
        type: signalType,
        name: row.signal_name || signalType,
        category: row.signal_category || '시그널',
      });
    }
  }

  return [...byStock.values()]
    .map((stock) => {
      const signals = [...stock.signalTypes.values()];
      return {
        code: stock.code,
        name: stock.name || stock.code,
        market: stock.market,
        signalCount: signals.length,
        signals,
      };
    })
    .filter((stock) => stock.signalCount >= minSignalCount)
    .sort((a, b) => {
      if (b.signalCount !== a.signalCount) return b.signalCount - a.signalCount;
      return String(a.name).localeCompare(String(b.name), 'ko');
    })
    .slice(0, limit);
}

export function useTodayHotSignalStocks({
  minSignalCount = DEFAULT_MIN_SIGNAL_COUNT,
  limit = DEFAULT_LIMIT,
} = {}) {
  const [stocks, setStocks] = useState([]);
  const [date, setDate] = useState(() => toYmd(new Date()));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    async function run() {
      const todayYmd = toYmd(new Date());
      if (!todayYmd) {
        if (active) {
          setStocks([]);
          setDate(null);
          setLoading(false);
          setError('오늘 날짜를 계산하지 못했습니다.');
        }
        return;
      }

      if (active) {
        setDate(todayYmd);
        setLoading(true);
      }

      try {
        const { data, error: fetchError } = await fetchSignalsForDateRange(todayYmd, todayYmd);
        if (!active) return;

        if (fetchError) {
          setStocks([]);
          setError(fetchError.message || String(fetchError));
          setLoading(false);
          return;
        }

        setStocks(buildHotSignalStocks(data || [], minSignalCount, limit));
        setError(null);
        setLoading(false);
      } catch (e) {
        if (!active) return;
        setStocks([]);
        setError(e?.message ? String(e.message) : String(e));
        setLoading(false);
      }
    }

    void run();

    const intervalId = window.setInterval(() => {
      void run();
    }, SIGNAL_POLL_INTERVAL_MS);

    const onVisibility = () => {
      if (document.visibilityState === 'visible') void run();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      active = false;
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [limit, minSignalCount]);

  return { stocks, date, loading, error };
}
