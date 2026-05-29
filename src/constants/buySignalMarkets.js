/** 국내 매수 시그널 시장 (scanner.py KOSPI/KOSDAQ) */
export const KR_BUY_SIGNAL_MARKETS = ['KOSPI', 'KOSDAQ'];

/** 미국 지수 매수 시그널 — S&P500(SPY), 나스닥100(QQQ) */
export const US_SP500_MARKET = 'SP500';
export const US_NASDAQ_MARKET = 'NASDAQ';
export const US_BUY_SIGNAL_MARKETS = [US_SP500_MARKET, US_NASDAQ_MARKET];

/** 업비트 코인 — scanner market 필드 CRYPTO_{심볼} (BTC·ETH·XRP 외 SOL 등 포함) */
export const CRYPTO_MARKET_PREFIX = 'CRYPTO_';
/** useSignalEvents 시장 필터용 sentinel */
export const CRYPTO_MARKET_FILTER = '__CRYPTO__';

export const CRYPTO_BTC_MARKET = 'CRYPTO_BTC';
export const CRYPTO_ETH_MARKET = 'CRYPTO_ETH';
export const CRYPTO_XRP_MARKET = 'CRYPTO_XRP';

export function isKrBuySignalMarket(market) {
  return KR_BUY_SIGNAL_MARKETS.includes(String(market || '').trim());
}

export function isUsBuySignalMarket(market) {
  return US_BUY_SIGNAL_MARKETS.includes(String(market || '').trim());
}

export function isCryptoBuySignalMarket(market) {
  return String(market || '').trim().startsWith(CRYPTO_MARKET_PREFIX);
}

export function cryptoSymbolFromMarket(market) {
  const m = String(market || '').trim();
  if (!m.startsWith(CRYPTO_MARKET_PREFIX)) return '';
  return m.slice(CRYPTO_MARKET_PREFIX.length) || m;
}

/** 캘린더 그리드에 개별 표시할 시장 — 현재는 모두 날짜별 요약 */
export function isIndividualBuySignalMarket() {
  return false;
}

export function buySignalMarketLabel(market) {
  const m = String(market || '').trim();
  if (m === US_SP500_MARKET) return 'S&P500';
  if (m === US_NASDAQ_MARKET) return '나스닥';
  if (isCryptoBuySignalMarket(m)) return cryptoSymbolFromMarket(m) || '코인';
  if (m === 'KOSPI') return 'KOSPI';
  if (m === 'KOSDAQ') return 'KOSDAQ';
  return m || '시장미상';
}

const CRYPTO_CHIP_STYLES = {
  [CRYPTO_BTC_MARKET]: { bgcolor: '#fff3e0', color: '#e65100' },
  [CRYPTO_ETH_MARKET]: { bgcolor: '#e8eaf6', color: '#3949ab' },
  [CRYPTO_XRP_MARKET]: { bgcolor: '#eceff1', color: '#37474f' },
};

export function buySignalMarketChipStyle(market) {
  const m = String(market || '').trim();
  if (m === US_SP500_MARKET) {
    return { bgcolor: '#e8eaf6', color: '#283593' };
  }
  if (m === US_NASDAQ_MARKET) {
    return { bgcolor: '#fce4ec', color: '#ad1457' };
  }
  if (CRYPTO_CHIP_STYLES[m]) return CRYPTO_CHIP_STYLES[m];
  if (isCryptoBuySignalMarket(m)) {
    return { bgcolor: '#f3e5f5', color: '#6a1b9a' };
  }
  if (m === 'KOSPI') {
    return { bgcolor: '#e3f2fd', color: '#1565c0' };
  }
  return { bgcolor: '#f3e5f5', color: '#6a1b9a' };
}

export function cryptoCategoryColor(market) {
  const m = String(market || '').trim();
  if (m === CRYPTO_BTC_MARKET) return '#f7931a';
  if (m === CRYPTO_ETH_MARKET) return '#627eea';
  if (m === CRYPTO_XRP_MARKET) return '#546e7a';
  if (isCryptoBuySignalMarket(m)) return '#8e24aa';
  return '#455a64';
}
