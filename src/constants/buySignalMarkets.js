/** 국내 매수 시그널 시장 (scanner.py KOSPI/KOSDAQ) */
export const KR_BUY_SIGNAL_MARKETS = ['KOSPI', 'KOSDAQ'];

/** 미국 지수 매수 시그널 — S&P500(SPY), 나스닥100(QQQ) */
export const US_SP500_MARKET = 'SP500';
export const US_NASDAQ_MARKET = 'NASDAQ';
export const US_BUY_SIGNAL_MARKETS = [US_SP500_MARKET, US_NASDAQ_MARKET];

/** 업비트 코인 매수 시그널 — BTC·ETH·XRP */
export const CRYPTO_BTC_MARKET = 'CRYPTO_BTC';
export const CRYPTO_ETH_MARKET = 'CRYPTO_ETH';
export const CRYPTO_XRP_MARKET = 'CRYPTO_XRP';
export const CRYPTO_BUY_SIGNAL_MARKETS = [CRYPTO_BTC_MARKET, CRYPTO_ETH_MARKET, CRYPTO_XRP_MARKET];

export function isKrBuySignalMarket(market) {
  return KR_BUY_SIGNAL_MARKETS.includes(String(market || '').trim());
}

export function isUsBuySignalMarket(market) {
  return US_BUY_SIGNAL_MARKETS.includes(String(market || '').trim());
}

export function isCryptoBuySignalMarket(market) {
  return CRYPTO_BUY_SIGNAL_MARKETS.includes(String(market || '').trim());
}

/** 캘린더에 종목명으로 개별 표시할 시장 (국내·코인은 날짜별 요약) */
export function isIndividualBuySignalMarket(market) {
  return isUsBuySignalMarket(market);
}

export function buySignalMarketLabel(market) {
  const m = String(market || '').trim();
  if (m === US_SP500_MARKET) return 'S&P500';
  if (m === US_NASDAQ_MARKET) return '나스닥';
  if (m === CRYPTO_BTC_MARKET) return 'BTC';
  if (m === CRYPTO_ETH_MARKET) return 'ETH';
  if (m === CRYPTO_XRP_MARKET) return 'XRP';
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
  if (m === CRYPTO_BTC_MARKET) {
    return { bgcolor: '#fff3e0', color: '#e65100' };
  }
  if (m === CRYPTO_ETH_MARKET) {
    return { bgcolor: '#e8eaf6', color: '#3949ab' };
  }
  if (m === CRYPTO_XRP_MARKET) {
    return { bgcolor: '#eceff1', color: '#37474f' };
  }
  if (m === 'KOSPI') {
    return { bgcolor: '#e3f2fd', color: '#1565c0' };
  }
  return { bgcolor: '#f3e5f5', color: '#6a1b9a' };
}
