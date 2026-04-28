/**
 * 서울시 열린데이터 광역철도 시간표 API (브라우저 직접 호출)
 * @see https://data.seoul.go.kr/dataList/OA-12764/A/1/dataset.do
 */

function normalizeEnv(v) {
  if (v == null) return '';
  return String(v).replace(/^\uFEFF/, '').trim().replace(/\r/g, '').replace(/\n/g, '');
}

const API_KEY = normalizeEnv(import.meta.env.VITE_SEOUL_SUBWAY_API_KEY);
/** HTTPS 권장. 배포 사이트에서 CORS 시 Worker 프록시 URL로 바꿀 수 있음 */
const ORIGIN = normalizeEnv(import.meta.env.VITE_SEOUL_SUBWAY_ORIGIN) || 'https://openapi.seoul.go.kr:8088';

export function isSeoulSubwayConfigured() {
  return Boolean(API_KEY);
}

/**
 * 로컬(dev): Vite가 `/__seoul_subway_proxy` → openapi.seoul 로 프록시해 CORS 회피.
 * 프로덕션: 브라우저가 서울 도메인으로 직접 요청 → **CORS 또는 혼합 콘텐츠** 이슈 가능.
 */
export function getSeoulSubwayBaseUrl() {
  if (!API_KEY) return null;
  if (import.meta.env.DEV) {
    return '/__seoul_subway_proxy';
  }
  return `${ORIGIN.replace(/\/$/, '')}/${API_KEY}/json`;
}

function normalizeRows(row) {
  if (!row) return [];
  return Array.isArray(row) ? row : [row];
}

/** 서울 API 공통 RESULT — INFO- 로 시작하면 정상 계열 */
function rowsFromSeoulService(json, serviceName) {
  if (!json || typeof json !== 'object') return [];
  const svc = json[serviceName];
  if (!svc || typeof svc !== 'object') return [];
  const code = svc.RESULT?.CODE;
  if (code != null && !String(code).startsWith('INFO')) return [];
  const row = svc.row;
  return normalizeRows(row);
}

export function getWeekdayType() {
  const day = new Date().getDay();
  if (day === 0) return 3;
  if (day === 6) return 2;
  return 1;
}

export function timeStrToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = String(timeStr).split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
}

export function getCurrentMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

export async function searchStationByName(name) {
  const base = getSeoulSubwayBaseUrl();
  if (!base || !name?.trim()) return [];
  try {
    const url = `${base}/SearchInfoBySubwayNameService/1/10/${encodeURIComponent(name.trim())}/`;
    const res = await fetch(url);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return [];
    return rowsFromSeoulService(data, 'SearchInfoBySubwayNameService');
  } catch {
    return [];
  }
}

/**
 * @param {string} frCode
 * @param {string|number} direction 1 상행 2 하행
 * @param {number} weekdayType 1 평일 2 토 3 일
 */
export async function fetchNextTrainTime(frCode, direction, weekdayType) {
  const base = getSeoulSubwayBaseUrl();
  if (!base || !frCode) return null;
  try {
    const url = `${base}/SearchSTNTimeTableByFRCodeService/1/200/${frCode}/${direction}/${weekdayType}/`;
    const res = await fetch(url);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return null;
    const rows = rowsFromSeoulService(data, 'SearchSTNTimeTableByFRCodeService');
    if (!rows.length) return null;
    const nowMin = getCurrentMinutes();
    const next = rows.find((r) => timeStrToMinutes(r.ARRIVETIME) > nowMin);
    return next?.ARRIVETIME || null;
  } catch {
    return null;
  }
}
