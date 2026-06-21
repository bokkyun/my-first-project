import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { deleteStockTrade } from '../utils/stockTradeSave';

function toYmd(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function exclusiveEndToInclusiveLastYmd(exclusiveEnd) {
  if (!(exclusiveEnd instanceof Date) || Number.isNaN(exclusiveEnd.getTime())) return null;
  return toYmd(new Date(exclusiveEnd.getTime() - 1));
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

function spanDaysInclusive(startYmd, endYmd) {
  if (!startYmd || !endYmd) return 0;
  const partsS = startYmd.split('-').map(Number);
  const partsE = endYmd.split('-').map(Number);
  if (partsS.length !== 3 || partsE.length !== 3) return 0;
  const t1 = new Date(partsS[0], partsS[1] - 1, partsS[2]).getTime();
  const t2 = new Date(partsE[0], partsE[1] - 1, partsE[2]).getTime();
  if (Number.isNaN(t1) || Number.isNaN(t2)) return 0;
  return Math.round((t2 - t1) / 86400000) + 1;
}

function widenQueryYmdRange(startYmd, endYmd, minSpanDays = 42) {
  if (!startYmd || !endYmd) return { start: startYmd, end: endYmd };
  const span = spanDaysInclusive(startYmd, endYmd);
  if (span >= minSpanDays) return { start: startYmd, end: endYmd };
  const pad = Math.ceil((minSpanDays - span) / 2);
  return {
    start: addDaysToYmd(startYmd, -pad),
    end: addDaysToYmd(endYmd, pad),
  };
}

export function stockTradeToCalendarEvent(row) {
  const date = String(row.trade_date).slice(0, 10);
  const isBuy = row.trade_type === 'buy';
  const market = row.market_type === 'domestic' ? '국' : '해';
  const name = String(row.stock_name || row.ticker || '종목').trim();
  const typeLabel = isBuy ? '매수' : '매도';
  let profitSuffix = '';
  if (!isBuy && row.profit_krw != null && row.profit_krw !== '') {
    const p = Number(row.profit_krw) || 0;
    profitSuffix = ` ${p >= 0 ? '+' : ''}${p.toLocaleString()}`;
  }
  return {
    id: `stock-trade-${row.id}`,
    title: `${market} ${name} ${typeLabel}${profitSuffix}`,
    starts_at: `${date}T00:00:00`,
    ends_at: `${date}T23:59:59`,
    is_all_day: true,
    color: isBuy ? '#1565c0' : '#2e7d32',
    _external: 'stock-trade',
    _stockTradeRow: row,
    creator_id: row.user_id,
  };
}

/**
 * @param {string|null} userId
 * @param {{ start: Date, end: Date }} viewRange
 * @param {boolean} [enabled]
 */
export function useStockTrades(userId, viewRange, enabled = true) {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTrades = useCallback(async () => {
    if (!userId || !enabled) {
      setTrades([]);
      setError(null);
      return;
    }

    const startYmd = toYmd(viewRange?.start);
    const endYmd = exclusiveEndToInclusiveLastYmd(viewRange?.end);
    if (!startYmd || !endYmd) return;

    const { start, end } = widenQueryYmdRange(startYmd, endYmd);

    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('stock_trades')
      .select('*')
      .eq('user_id', userId)
      .gte('trade_date', start)
      .lte('trade_date', end)
      .order('trade_date', { ascending: true })
      .order('created_at', { ascending: true });

    setLoading(false);
    if (err) {
      setError(err.message);
      setTrades([]);
      return;
    }
    setTrades(data || []);
  }, [userId, enabled, viewRange?.start?.getTime(), viewRange?.end?.getTime()]);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  const calendarEvents = useMemo(
    () => (trades || []).map(stockTradeToCalendarEvent),
    [trades],
  );

  const removeTrade = useCallback(async (tradeId) => {
    const { error: err } = await deleteStockTrade(tradeId);
    if (!err) await fetchTrades();
    return { error: err };
  }, [fetchTrades]);

  return {
    trades,
    calendarEvents,
    loading,
    error,
    refreshStockTrades: fetchTrades,
    deleteStockTrade: removeTrade,
  };
}
