/** 국내 매수 시그널 시장 (scanner.py KOSPI/KOSDAQ) */
export const KR_BUY_SIGNAL_MARKETS = ['KOSPI', 'KOSDAQ'];

/** 미국 지수 매수 시그널 — S&P500(SPY), 나스닥100(QQQ) */
export const US_SP500_MARKET = 'SP500';
export const US_NASDAQ_MARKET = 'NASDAQ';
export const US_BUY_SIGNAL_MARKETS = [US_SP500_MARKET, US_NASDAQ_MARKET];

export function isKrBuySignalMarket(market) {
  return KR_BUY_SIGNAL_MARKETS.includes(String(market || '').trim());
}

export function isUsBuySignalMarket(market) {
  return US_BUY_SIGNAL_MARKETS.includes(String(market || '').trim());
}

export function buySignalMarketLabel(market) {
  const m = String(market || '').trim();
  if (m === US_SP500_MARKET) return 'S&P500';
  if (m === US_NASDAQ_MARKET) return '나스닥';
  if (m === 'KOSPI') return 'KOSPI';
  if (m === 'KOSDAQ') return 'KOSDAQ';
  return m || '시장미상';
}

export function buySignalMarketChipStyle(market) {
  const m = String(market || '').trim();
  if (m === US_SP500_MARKET) {
    return { bgcolor: '#e8eaf6', color: '#283593' };
  }
  if (m === US_NASDAQ_MARKET) {
    return { bgcolor: '#fce4ec', color: '#ad1457' };
  }
  if (m === 'KOSPI') {
    return { bgcolor: '#e3f2fd', color: '#1565c0' };
  }
  return { bgcolor: '#f3e5f5', color: '#6a1b9a' };
}
