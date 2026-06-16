import { useCallback, useEffect, useState } from 'react';
import { getDailyProfitsByRange } from '../utils/stockStats';

function toYmd(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** FullCalendar datesSet end(배타) → 포함 마지막 날 */
function exclusiveEndToInclusiveYmd(exclusiveEnd) {
  if (!(exclusiveEnd instanceof Date) || Number.isNaN(exclusiveEnd.getTime())) return null;
  return toYmd(new Date(exclusiveEnd.getTime() - 86400000));
}

/**
 * 캘린더 표시 구간의 날짜별 주식 실현손익
 * @param {string|null} userId
 * @param {{ start: Date, end: Date }} viewRange
 */
export function useStockDailyProfits(userId, viewRange) {
  const [byDate, setByDate] = useState({});
  const [error, setError] = useState(null);

  const refreshStockProfits = useCallback(async () => {
    if (!userId || !viewRange?.start || !viewRange?.end) {
      setByDate({});
      setError(null);
      return;
    }

    const fromYmd = toYmd(viewRange.start);
    const toYmdStr = exclusiveEndToInclusiveYmd(viewRange.end);
    if (!fromYmd || !toYmdStr) return;

    const { byDate: next, error: err } = await getDailyProfitsByRange(userId, fromYmd, toYmdStr);
    setByDate(next);
    setError(err);
  }, [userId, viewRange?.start?.getTime(), viewRange?.end?.getTime()]);

  useEffect(() => {
    void refreshStockProfits();
  }, [refreshStockProfits]);

  return { byDate, error, refreshStockProfits };
}
