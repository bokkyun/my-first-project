/**
 * 커피 이벤트 메뉴 코드 및 표시/집계
 */

export const COFFEE_MENU_TYPES = [
  { value: 'americano', label: '아메리카노' },
  { value: 'latte', label: '라떼' },
  { value: 'matcha_latte', label: '말차라떼' },
  { value: 'macchiato', label: '마키아또' },
  { value: 'custom', label: '기타' },
];

/**
 * @param {object|null|undefined} order - coffee_orders row
 */
export function orderToFormState(order) {
  if (!order) {
    return {
      menuType: 'americano',
      stdTemp: 'ice',
      customText: '',
      customTemp: null,
    };
  }
  if (order.menu_type === 'custom') {
    return {
      menuType: 'custom',
      stdTemp: 'ice',
      customText: order.custom_text || '',
      customTemp: order.temperature === 'ice' || order.temperature === 'hot' ? order.temperature : null,
    };
  }
  return {
    menuType: order.menu_type || 'americano',
    stdTemp: order.temperature || 'ice',
    customText: '',
    customTemp: null,
  };
}

const MENU_MAP = Object.fromEntries(COFFEE_MENU_TYPES.map((m) => [m.value, m.label]));

/**
 * @param {{ menu_type: string, temperature?: string|null, custom_text?: string|null }} row
 * @returns {string}
 */
export function formatCoffeeOrderLabel(row) {
  if (!row) return '';
  if (row.menu_type === 'custom') {
    const t = row.temperature;
    const base = (row.custom_text || '').trim();
    if (t === 'ice') return `${base} (아이스)`;
    if (t === 'hot') return `${base} (핫)`;
    return base;
  }
  const drink = MENU_MAP[row.menu_type] || row.menu_type;
  const t = row.temperature === 'ice' ? '아이스' : '핫';
  return `${drink} ${t}`;
}

/**
 * @param {Array<{ user_id: string, nickname?: string|null, email?: string|null, menu_type: string, temperature?: string|null, custom_text?: string|null }>} rows
 * @returns {{ summaryLines: { label: string, count: number }[], nameLines: { name: string, label: string, userId: string }[] }}
 */
export function buildCoffeeSummary(rows) {
  const withNames = (rows || []).map((r) => {
    const label = formatCoffeeOrderLabel(r);
    const name = r.nickname || r.email || '이름 없음';
    return { name, label, userId: r.user_id };
  });

  const countByLabel = new Map();
  for (const { label } of withNames) {
    countByLabel.set(label, (countByLabel.get(label) || 0) + 1);
  }
  const summaryLines = [...countByLabel.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => a.label.localeCompare(b.label, 'ko'));

  const nameLines = [...withNames].sort((a, b) => {
    const c = a.name.localeCompare(b.name, 'ko');
    if (c !== 0) return c;
    return a.label.localeCompare(b.label, 'ko');
  });

  return { summaryLines, nameLines };
}
