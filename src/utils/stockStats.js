import { supabase } from '../lib/supabase';

function pad2(n) {
  return String(n).padStart(2, '0');
}

/** YYYY-MM-DD 해당 월의 마지막 날 */
function lastDayOfMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function monthRangeYmd(year, month) {
  const from = `${year}-${pad2(month)}-01`;
  const to = `${year}-${pad2(month)}-${pad2(lastDayOfMonth(year, month))}`;
  return { from, to };
}

function sumProfitByMarket(rows, marketType) {
  return (rows || [])
    .filter((r) => r.market_type === marketType)
    .reduce((s, r) => s + (Number(r.profit_krw) || 0), 0);
}

function groupByDate(rows) {
  return (rows || []).reduce((acc, row) => {
    const key = String(row.trade_date).slice(0, 10);
    if (!acc[key]) acc[key] = [];
    acc[key].push(row);
    return acc;
  }, {});
}

function aggregateProfitsByDate(rows) {
  const byDate = {};
  for (const row of rows || []) {
    const key = String(row.trade_date).slice(0, 10);
    if (!byDate[key]) byDate[key] = { domestic: 0, overseas: 0 };
    const amt = Number(row.profit_krw) || 0;
    if (row.market_type === 'domestic') byDate[key].domestic += amt;
    else if (row.market_type === 'overseas') byDate[key].overseas += amt;
  }
  return byDate;
}

/**
 * 기간 내 날짜별 국내/해외 실현손익 합계 (캘린더 셀용)
 * @param {string} userId
 * @param {string} fromYmd
 * @param {string} toYmd
 */
export async function getDailyProfitsByRange(userId, fromYmd, toYmd) {
  if (!userId || !fromYmd || !toYmd) {
    return { byDate: {}, error: null };
  }

  const { data, error } = await supabase
    .from('stock_trades')
    .select('trade_date, market_type, profit_krw')
    .eq('user_id', userId)
    .gte('trade_date', fromYmd)
    .lte('trade_date', toYmd)
    .eq('trade_type', 'sell');

  if (error) {
    return { byDate: {}, error: error.message };
  }

  return { byDate: aggregateProfitsByDate(data), error: null };
}

/**
 * @param {string} userId
 * @param {string} date YYYY-MM-DD
 */
export async function getDailyProfit(userId, date) {
  if (!userId || !date) {
    return { domestic: 0, overseas: 0, error: null };
  }

  const { data, error } = await supabase
    .from('stock_trades')
    .select('market_type, profit_krw')
    .eq('user_id', userId)
    .eq('trade_date', date)
    .eq('trade_type', 'sell');

  if (error) {
    return { domestic: 0, overseas: 0, error: error.message };
  }

  const rows = data || [];
  return {
    domestic: sumProfitByMarket(rows, 'domestic'),
    overseas: sumProfitByMarket(rows, 'overseas'),
    error: null,
  };
}

/**
 * @param {string} userId
 * @param {number} year
 * @param {number} month 1-12
 */
export async function getMonthlyProfit(userId, year, month) {
  if (!userId || !year || !month) {
    return { domestic: 0, overseas: 0, byDate: {}, error: null };
  }

  const { from, to } = monthRangeYmd(year, month);

  const { data, error } = await supabase
    .from('stock_trades')
    .select('trade_date, market_type, profit_krw')
    .eq('user_id', userId)
    .gte('trade_date', from)
    .lte('trade_date', to)
    .eq('trade_type', 'sell');

  if (error) {
    return { domestic: 0, overseas: 0, byDate: {}, error: error.message };
  }

  const rows = data || [];
  return {
    domestic: sumProfitByMarket(rows, 'domestic'),
    overseas: sumProfitByMarket(rows, 'overseas'),
    byDate: groupByDate(rows),
    error: null,
  };
}

/**
 * @param {string} userId
 * @param {number} year
 */
export async function getYearlyProfit(userId, year) {
  if (!userId || !year) {
    return { months: [], error: null };
  }

  const { data, error } = await supabase
    .from('stock_trades')
    .select('trade_date, market_type, profit_krw')
    .eq('user_id', userId)
    .gte('trade_date', `${year}-01-01`)
    .lte('trade_date', `${year}-12-31`)
    .eq('trade_type', 'sell');

  if (error) {
    return { months: [], error: error.message };
  }

  const rows = data || [];
  const months = Array.from({ length: 12 }, (_, i) => {
    const m = pad2(i + 1);
    const monthRows = rows.filter((r) => String(r.trade_date).startsWith(`${year}-${m}`));
    return {
      month: i + 1,
      domestic: sumProfitByMarket(monthRows, 'domestic'),
      overseas: sumProfitByMarket(monthRows, 'overseas'),
    };
  });

  return { months, error: null };
}
