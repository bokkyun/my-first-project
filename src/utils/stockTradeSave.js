import { supabase } from '../lib/supabase';
import { calcProfit } from './stockParser';

function localTodayYmd() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** AI 파싱 결과 → DB row 형태 */
export function normalizeParsedTrade(raw) {
  const market = String(raw?.market_type || '').toLowerCase();
  const market_type = market.includes('overseas') || market.includes('해외') ? 'overseas' : 'domestic';
  const tt = String(raw?.trade_type || '').toLowerCase();
  const trade_type = tt === 'sell' || tt.includes('매도') ? 'sell' : 'buy';

  return {
    trade_date: String(raw?.trade_date || localTodayYmd()).slice(0, 10),
    market_type,
    ticker: String(raw?.ticker || '').trim() || null,
    stock_name: String(raw?.stock_name || '').trim() || null,
    trade_type,
    quantity: Number(raw?.quantity) || 0,
    price: raw?.price != null && raw?.price !== '' ? Number(raw.price) : null,
    fee: Number(raw?.fee) || 0,
    tax: Number(raw?.tax) || 0,
    currency: String(raw?.currency || (market_type === 'domestic' ? 'KRW' : 'USD')).toUpperCase(),
    price_foreign: raw?.price_foreign != null && raw?.price_foreign !== ''
      ? Number(raw.price_foreign)
      : null,
    exchange_rate: raw?.exchange_rate != null && raw?.exchange_rate !== ''
      ? Number(raw.exchange_rate)
      : null,
  };
}

function sameSymbol(a, b) {
  if (a.ticker && b.ticker) return a.ticker === b.ticker;
  if (a.stock_name && b.stock_name) return a.stock_name === b.stock_name;
  return false;
}

async function findMatchingBuyInDb(userId, sell) {
  let query = supabase
    .from('stock_trades')
    .select('*')
    .eq('user_id', userId)
    .eq('trade_type', 'buy')
    .eq('market_type', sell.market_type)
    .lte('trade_date', sell.trade_date)
    .order('trade_date', { ascending: false })
    .limit(10);

  if (sell.ticker) query = query.eq('ticker', sell.ticker);
  else if (sell.stock_name) query = query.eq('stock_name', sell.stock_name);
  else return null;

  const { data, error } = await query;
  if (error) throw error;
  return data?.[0] ?? null;
}

function findMatchingBuyInBatch(sell, batchBuys) {
  return batchBuys.find((b) => b.market_type === sell.market_type && sameSymbol(sell, b)) ?? null;
}

async function insertTrade(userId, trade, { profit_krw = null, buy_trade_id = null, raw_text = null } = {}) {
  const { data, error } = await supabase
    .from('stock_trades')
    .insert({
      user_id: userId,
      ...trade,
      profit_krw,
      buy_trade_id,
      raw_text,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * 파싱된 체결 배열 저장 (매수 먼저 → 매도 profit_krw 계산)
 * @param {string} userId
 * @param {object[]} trades
 * @param {string} [rawText]
 */
export async function saveStockTrades(userId, trades, rawText = null) {
  if (!userId) throw new Error('로그인이 필요합니다.');
  if (!trades?.length) throw new Error('저장할 체결 내역이 없습니다.');

  const normalized = trades.map(normalizeParsedTrade);
  const buys = normalized.filter((t) => t.trade_type === 'buy');
  const sells = normalized.filter((t) => t.trade_type === 'sell');

  const saved = [];
  const batchBuys = [];

  for (const buy of buys) {
    const row = await insertTrade(userId, buy, { raw_text: rawText });
    batchBuys.push(row);
    saved.push(row);
  }

  for (const sell of sells) {
    const batchBuy = findMatchingBuyInBatch(sell, batchBuys);
    const dbBuy = batchBuy ? null : await findMatchingBuyInDb(userId, sell);
    const buyRef = batchBuy || dbBuy;
    const profit = buyRef ? calcProfit(sell, buyRef) : null;

    const row = await insertTrade(userId, sell, {
      profit_krw: profit,
      buy_trade_id: buyRef?.id ?? null,
      raw_text: rawText,
    });
    saved.push(row);
  }

  const dates = [...new Set(saved.map((r) => String(r.trade_date).slice(0, 10)))];
  return { saved, dates };
}

/** @param {string} tradeId */
export async function deleteStockTrade(tradeId) {
  if (!tradeId) return { error: new Error('삭제할 체결 내역이 없습니다.') };
  const { error } = await supabase.from('stock_trades').delete().eq('id', tradeId);
  return { error };
}
