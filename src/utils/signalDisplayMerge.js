/**
 * 매수 시그널 표시용: 동일 날짜·신호 카테고리(추세/모멘텀/볼린저)·종목 단위로 묶음.
 * 같은 종목에 여러 signal_type 이 있으면 한 그룹(배열)으로 반환한다.
 */
export function groupSignalRowsForDisplay(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return [];
  const m = new Map();
  for (const row of rows) {
    const code = String(row.code ?? '').trim();
    const name = String(row.name ?? '').trim();
    const stockKey = code || `name:${name}`;
    const cat = String(row.signal_category ?? '기타');
    const date = String(row.date ?? '');
    const k = `${date}|${cat}|${stockKey}`;
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(row);
  }
  return [...m.values()].map((grp) => {
    const byType = new Map();
    for (const r of grp) {
      const st = String(r.signal_type ?? '');
      if (!byType.has(st)) byType.set(st, r);
    }
    return [...byType.values()].sort((a, b) => String(a.signal_type).localeCompare(String(b.signal_type)));
  });
}
