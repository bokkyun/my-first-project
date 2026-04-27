/**
 * 서울시 열린데이터 광역철도 시간표 API (브라우저 직접 호출)
 * @see https://data.seoul.go.kr/dataList/OA-12764/A/1/dataset.do
 */

function normalizeEnv(v) {
  if (v == null) return '';
  return String(v).replace(/^\uFEFF/, '').trim().replace(/\r/g, '').replace(/\n/g, '');
}

const API_KEY = normalizeEnv(import.meta.env.VITE_SEOUL_SUBWAY_API_KEY);
/** HTTPS 권장(Cloudflare Pages 등). 로컬에서 CORS/혼합 콘텐츠 이슈 시 Origin 조정 */
const ORIGIN = normalizeEnv(import.meta.env.VITE_SEOUL_SUBWAY_ORIGIN) || 'https://openapi.seoul.go.kr:8088';

export function isSeoulSubwayConfigured() {
  return Boolean(API_KEY);
}

export function getSeoulSubwayBaseUrl() {
  if (!API_KEY) return null;
  return `${ORIGIN.replace(/\/$/, '')}/${API_KEY}/json`;
}

function normalizeRows(row) {
  if (!row) return [];
  return Array.isArray(row) ? row : [row];
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
    const data = await res.json();
    return normalizeRows(data?.SearchInfoBySubwayNameService?.row);
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
    const data = await res.json();
    const rows = normalizeRows(data?.SearchSTNTimeTableByFRCodeService?.row);
    if (!rows.length) return null;
    const nowMin = getCurrentMinutes();
    const next = rows.find((r) => timeStrToMinutes(r.ARRIVETIME) > nowMin);
    return next?.ARRIVETIME || null;
  } catch {
    return null;
  }
}
