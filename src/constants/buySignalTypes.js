/**
 * 사이드바 `signalTypeFilters` 키와 동일해야 합니다.
 * DB에만 있고 UI에 없는 타입은, 사용자가 이 목록을 전부 켠 경우에도 표시되도록 쿼리 필터를 건너뜁니다.
 */
export const ALL_BUY_SIGNAL_TYPE_KEYS = [
  'MACD_GOLDEN_CROSS',
  'MA_GOLDEN_CROSS',
  'PRICE_ABOVE_MA20',
  'MA_ALIGNMENT',
  'RSI_OVERSOLD_EXIT',
  'RSI_50_CROSS',
  'STOCH_GOLDEN_CROSS',
  'CCI_MINUS100_CROSS',
  'BOLL_LOWER_BOUNCE',
  'BOLL_SQUEEZE_BREAKOUT',
  'BOLL_MIDLINE_RECOVERY',
];

/** 체크된 종류가 UI에서 정의한 전부와 같을 때(개수까지 동일) */
export function isFullBuySignalTypeSelection(enabledTypes) {
  if (!Array.isArray(enabledTypes) || enabledTypes.length !== ALL_BUY_SIGNAL_TYPE_KEYS.length) {
    return false;
  }
  const set = new Set(enabledTypes);
  return ALL_BUY_SIGNAL_TYPE_KEYS.every((k) => set.has(k));
}

/**
 * localStorage 등에 예전 키가 더 있어도, 정의된 전 종류가 모두 켜져 있으면
 * 클라이언트 signal_type 필터를 생략합니다(전부 켬과 동일).
 */
export function coversAllBuySignalTypes(enabledTypes) {
  if (!Array.isArray(enabledTypes) || enabledTypes.length === 0) return false;
  const set = new Set(enabledTypes);
  return ALL_BUY_SIGNAL_TYPE_KEYS.every((k) => set.has(k));
}
