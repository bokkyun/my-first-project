import { parseImageWithModelFallback, stripModelJsonFences } from './openRouterVision';

const STOCK_TRADE_PROMPT = `이 이미지는 주식 매매 체결 내역 캡처입니다 (HTS, MTS, 또는 체결 문자).
다음 정보를 추출해서 반드시 JSON 배열로만 응답하세요 (마크다운 없이):

[
  {
    "trade_date": "YYYY-MM-DD",
    "market_type": "domestic 또는 overseas",
    "ticker": "종목코드",
    "stock_name": "종목명",
    "trade_type": "buy 또는 sell",
    "quantity": 수량(숫자),
    "price": 체결가(숫자, 원화),
    "fee": 수수료(숫자, 없으면 0),
    "tax": 세금(숫자, 없으면 0),
    "currency": "KRW 또는 USD 등",
    "price_foreign": 외화체결가(해외주식만, 없으면 null),
    "exchange_rate": 환율(해외주식만, 없으면 null)
  }
]

여러 건이면 배열에 모두 포함. 날짜 없으면 오늘 날짜 사용.`;

function parseTradeJson(text) {
  const parsed = JSON.parse(stripModelJsonFences(text));
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === 'object') return [parsed];
  throw new Error('체결 JSON은 배열이어야 합니다.');
}

/**
 * 주식 매매 체결 캡처 이미지 → 체결 배열
 * @returns {Promise<{ trades: object[], _model: string }>}
 */
export async function parseStockTradeImage(base64Image, mimeType = 'image/jpeg') {
  const result = await parseImageWithModelFallback({
    base64Image,
    mimeType,
    prompt: STOCK_TRADE_PROMPT,
    maxTokens: 2000,
    logTag: 'stockParser',
    parseJson: parseTradeJson,
  });

  return {
    trades: result.trades || [],
    _model: result._model,
  };
}

function isOverseasTrade(trade) {
  return trade.market_type === 'overseas'
    || (trade.currency && String(trade.currency).toUpperCase() !== 'KRW');
}

/**
 * 매도 체결의 실현손익(원화)
 * @param {object} sellTrade
 * @param {object} [buyTrade]
 * @returns {number|null}
 */
export function calcProfit(sellTrade, buyTrade) {
  if (!sellTrade || sellTrade.trade_type !== 'sell') return 0;

  const buy = buyTrade || {
    price: sellTrade.buy_price,
    price_foreign: sellTrade.buy_price_foreign,
    fee: sellTrade.buy_fee ?? 0,
    exchange_rate: sellTrade.exchange_rate,
  };

  if (isOverseasTrade(sellTrade)) {
    const sellPx = sellTrade.price_foreign ?? sellTrade.price;
    const buyPx = buy.price_foreign ?? buy.price;
    const rate = sellTrade.exchange_rate ?? buy.exchange_rate;
    if (sellPx == null || buyPx == null || rate == null) return null;
    const foreignProfit = (Number(sellPx) - Number(buyPx)) * Number(sellTrade.quantity || 0);
    return Math.round(foreignProfit * Number(rate))
      - Number(sellTrade.fee || 0)
      - Number(sellTrade.tax || 0)
      - Number(buy.fee || 0);
  }

  const sellPx = sellTrade.price ?? sellTrade.sell_price;
  const buyPx = buy.price ?? buyTrade?.price ?? sellTrade.buy_price;
  if (sellPx == null || buyPx == null) return null;

  return (Number(sellPx) - Number(buyPx)) * Number(sellTrade.quantity || 0)
    - Number(sellTrade.fee || 0)
    - Number(sellTrade.tax || 0)
    - Number(buy.fee || 0);
}

export function calcProfitFromPair(sell, buy) {
  return calcProfit(sell, buy);
}
