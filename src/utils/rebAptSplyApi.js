/**
 * 한국부동산원 청약홈 분양정보(공공데이터)
 * - datago: apis.data.go.kr (XML/JSON 표준)
 * - odcloud: api.odcloud.kr (한국부동산원 청약홈·ApplyhomeInfoDetailSvc, data 배열)
 *   기본: getAPTLttotPblancDetail (page·perPage·serviceKey / Swagger 37000 stage)
 *
 * @see https://www.data.go.kr
 */

/** 기본: 청약홈 분양정보(REST). 구 uddi·data.go 만 쓰려면 VITE_REB_APT_ODCLOUD_PATH·API_MODE로 조정 */
const DEFAULT_MODE = 'odcloud';
const DEFAULT_ODCLOUD_PATH =
  '/api/ApplyhomeInfoDetailSvc/v1/getAPTLttotPblancDetail';

function getApiMode() {
  return (import.meta.env.VITE_REB_APT_API_MODE || DEFAULT_MODE).toLowerCase();
}

function parseYmdToIsoStart(v) {
  if (v == null || v === '') return null;
  const s = String(v).replace(/[^0-9]/g, '');
  if (s.length >= 8) {
    const y = s.slice(0, 4);
    const m = s.slice(4, 6);
    const d = s.slice(6, 8);
    return `${y}-${m}-${d}T00:00:00`;
  }
  if (s.length === 6) {
    return `${s.slice(0, 4)}-${s.slice(4, 6)}-01T00:00:00`;
  }
  return null;
}

function parseYmdToIsoEndOfDay(v) {
  const start = parseYmdToIsoStart(v);
  if (!start) return null;
  const d = new Date(start);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

/**
 * data.go.kr 표준 response, 또는 api.odcloud.kr JSON
 */
export function parseRebAptSplyResponse(json) {
  if (!json || typeof json !== 'object') {
    return { items: [], error: '빈 응답입니다.' };
  }

  if (Object.prototype.hasOwnProperty.call(json, 'data') && Array.isArray(json.data)) {
    if (json.code != null && Number(json.code) < 0) {
      return { items: [], error: String(json.msg || json.message || 'API 오류') };
    }
    return { items: json.data, error: null };
  }
  if (Number(json.code) < 0 && (!json.data || (Array.isArray(json.data) && json.data.length === 0))) {
    return { items: [], error: String(json.msg || json.message || 'API 오류') };
  }

  const res = json.response;
  if (!res) {
    if (Array.isArray(json) || json.hits) {
      return { items: Array.isArray(json) ? json : [json], error: null };
    }
    return { items: [], error: '응답 형식이 예상과 다릅니다.' };
  }
  const header = res.header;
  if (header) {
    const code = String(header.resultCode || header.resultcode || '');
    if (code && code !== '00' && code !== '0') {
      return {
        items: [],
        error: header.resultMsg || header.resultMessage || `API 오류 (${code})`,
      };
    }
  }
  const body = res.body;
  if (!body) return { items: [], error: null };
  if (Array.isArray(body)) {
    return { items: body, error: null };
  }
  const items = body.items;
  if (!items) return { items: [], error: null };
  if (Array.isArray(items)) return { items, error: null };
  if (items.item) {
    const it = items.item;
    return { items: Array.isArray(it) ? it : [it], error: null };
  }
  if (Array.isArray(items)) return { items, error: null };
  return { items: [items], error: null };
}

/** YYYYMMDD (로컬 날짜) — `20260530` 형식과 문자열 비교에 사용 */
export function ymd8Today() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * uddi 응답: 접수마감일(영문·한글) → 숫자만 8자리 또는 ''
 */
export function getOdcloudReceiptEndYmd8(item) {
  if (!item || typeof item !== 'object') return '';
  const v = item.RCEPT_ENDDE
    ?? item.SPLY_RCEPT_ENDDE
    ?? item.SPLY_RCEPT_CLSDE
    ?? item.rceptEndde
    ?? item['접수마감일']
    ?? item['접수종료일'];
  if (v == null || v === '') return '';
  const s = String(v).replace(/\D/g, '');
  return s.length >= 8 ? s.slice(0, 8) : '';
}

/**
 * 오늘(YYYYMMDD) 이후·당일에 접수가 끝나는(진행·예정) 건만 — 클라이언트 필터
 * @param {object[]} items
 */
export function filterOdcloudItemsUpcoming(items) {
  const today = ymd8Today();
  if (!Array.isArray(items)) return [];
  return items.filter((row) => {
    const end = getOdcloudReceiptEndYmd8(row);
    if (!end) return false;
    return end >= today;
  });
}

/**
 * api.odcloud.kr 행(한글·RCEPT_* 필드명) → 캘린더 이벤트
 */
export function mapOdcloudItemToCalendarEvent(item, index) {
  if (!item || typeof item !== 'object') return null;
  const t = (k) => (item[k] != null && item[k] !== '' ? String(item[k]).trim() : '');
  const firstT = (...keys) => {
    for (const k of keys) {
      const v = t(k);
      if (v) return v;
    }
    return '';
  };

  // 지역(시·도 + 시·군·구) + 단지/주택명 — 캘린더 셀에 "아파트 분양"만 나오는 경우 방지
  const region = [t('CTPRVN_NM'), t('SIGNGU_NM')].filter(Boolean).join(' ').trim();
  const nameForCalendar = firstT(
    'HSMP_NM',
    'HOUSE_NM',
    'PBLANC_NM',
    'SPLY_HSMP_NM',
    'HSSPLY_HSMP_NM',
    '주택명',
    '아파트명',
    '사업명',
    'BIZ_NM',
    'SPLY_BIZ_NM',
    'BLDG_NM',
  ) || '아파트 분양';
  const titleCore = [region, nameForCalendar].filter((x) => x).join(' · ');
  const p1 = firstT('공고번호', 'PBLANC_NO');
  const p2 = firstT('주택관리번호', 'HOUSE_MGMT_NO', 'HSMP_MGMT_NO');
  const pbl = p1 || p2 ? ` (${[p1, p2].filter(Boolean).join(' / ')})` : '';

  const startYmd = firstT(
    'RCEPT_BGNDE',
    'SPLY_RCEPT_BGNDE',
    'SPLY_RCEPT_STTDE',
    'rceptBgnde',
    '접수시작일',
    '청약접수시작일',
    '입주자모집공고일',
    '공고일',
    '모집공고일',
    '접수기간',
  );
  const endYmd = firstT(
    'RCEPT_ENDDE',
    'SPLY_RCEPT_ENDDE',
    'SPLY_RCEPT_CLSDE',
    'rceptEndde',
    '접수마감일',
    '접수종료일',
    '청약접수마감일',
  ) || startYmd;

  let starts = parseYmdToIsoStart(startYmd);
  if (!starts) {
    for (const v of Object.values(item)) {
      if (v == null) continue;
      const s = String(v);
      if (/\d{4}[-/.\s]?\d{2}[-/.\s]?\d{2}/.test(s) || /\d{8}/.test(s)) {
        starts = parseYmdToIsoStart(s);
        if (starts) break;
      }
    }
  }
  if (!starts) {
    const d = new Date();
    starts = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T00:00:00`;
  }
  const ends = parseYmdToIsoEndOfDay(endYmd) || parseYmdToIsoEndOfDay(startYmd) || starts;

  const idKey =
    firstT('주택관리번호', 'HOUSE_MGMT_NO', 'HSMP_MGMT_NO')
    + firstT('공고번호', 'PBLANC_NO')
    + String(index);
  const id = `reb-od-${idKey.replace(/[^a-zA-Z0-9가-힣\-_]/g, '_').slice(0, 80)}-${index}`;

  return {
    id,
    title: `🏢 ${titleCore}${pbl}`,
    starts_at: starts,
    ends_at: ends,
    is_all_day: true,
    color: '#0d47a1',
    _external: 'reb-odcloud',
    _rebRaw: item,
    creator_id: null,
    creatorNickname: '청약홈(부동산원·ODcloud)',
  };
}

/**
 * data.go 기존 item → 캘린더 이벤트
 */
export function mapSplyItemToCalendarEvent(item, index) {
  if (!item || typeof item !== 'object') return null;

  const titleBase =
    item.aptNm
    || item.hmsApt
    || item.houseNm
    || item.pblancNm
    || item.bildNm
    || item.aptDong
    || '아파트 분양';

  const pbl = item.pblancNo != null || item.rceptMth != null
    ? ` (${[item.pblancNo, item.rceptMth].filter(Boolean).join(' / ')})`
    : '';

  const startYmd = item.rceptBgnde
    || item.receptStrtDttm
    || item.rcptStrtDttm
    || item.pblancDttm
    || item.pblancDay
    || item.pblancDt
    || item.rceptMth;

  const endYmd = item.rceptEndde
    || item.receptDttm
    || item.rceptEndde
    || startYmd;

  const starts = parseYmdToIsoStart(startYmd);
  if (!starts) return null;
  const ends = parseYmdToIsoEndOfDay(endYmd) || parseYmdToIsoEndOfDay(startYmd) || starts;

  const id = `reb-apt-${String(item.pblancNo || item.aptSeq || item.rceptMth || index).replace(/[^a-zA-Z0-9-_]/g, '_')}`;

  return {
    id,
    title: `🏢 ${String(titleBase).trim()}${pbl}`,
    starts_at: starts,
    ends_at: ends,
    is_all_day: true,
    color: '#0d47a1',
    _external: 'reb-apt',
    _rebRaw: item,
    creator_id: null,
    creatorNickname: '청약홈(부동산원)',
  };
}

export function mapRebAptItemToCalendarEvent(item, index, mode) {
  const m = mode || getApiMode();
  if (m === 'odcloud') {
    return mapOdcloudItemToCalendarEvent(item, index);
  }
  return mapSplyItemToCalendarEvent(item, index);
}

function buildDataGoListUrl() {
  const key = (import.meta.env.VITE_DATA_GO_KR_SERVICE_KEY || '').trim();
  const serviceKey = key ? `serviceKey=${encodeURIComponent(key)}` : '';
  const pageNo = 'pageNo=1';
  const num = `numOfRows=${import.meta.env.VITE_REB_APT_PAGE_SIZE || 200}`;
  const type = 'resultType=json';
  const path = (import.meta.env.VITE_REB_APT_SPLY_PATH || '/1613000/AptBasisOflsInfoService/getAptBasisOflsList')
    .replace(/^\s+/, '');
  const query = [serviceKey, pageNo, num, type].filter(Boolean).join('&');
  return { path, query, keyPresent: Boolean(key), mode: 'datago' };
}

function buildOdcloudListUrl() {
  const key = (import.meta.env.VITE_DATA_GO_KR_SERVICE_KEY || '').trim();
  const perPage = import.meta.env.VITE_REB_APT_PAGE_SIZE || '200';
  const serviceKey = key ? `serviceKey=${encodeURIComponent(key)}` : '';
  const page = 'page=1';
  const pp = `perPage=${perPage}`;
  const path = (import.meta.env.VITE_REB_APT_ODCLOUD_PATH || DEFAULT_ODCLOUD_PATH)
    .replace(/^\s+/, '');
  /** 브라우저 테스트와 동일: page, perPage, serviceKey (returnType는 엔드포인트에 따라 생략) */
  const query = [page, pp, serviceKey].filter(Boolean).join('&');
  return { path, query, keyPresent: Boolean(key), mode: 'odcloud' };
}

/**
 * VITE_REB_APT_API_MODE=odcloud | datago
 */
export function buildRebAptSplyListUrl() {
  if (getApiMode() === 'datago') {
    return buildDataGoListUrl();
  }
  return buildOdcloudListUrl();
}

/**
 * 개발: Vite 프록시(동일 출처) / 배포: CORS 이슈 시 origin 프록시
 */
export function toDataGoAbsoluteUrl(path, query) {
  return toRebAptAbsoluteUrl(path, query, 'datago');
}

export function toRebAptAbsoluteUrl(path, query, mode) {
  const p = path.startsWith('/') ? path : `/${path}`;
  const q = query ? (query.startsWith('?') ? query : `?${query}`) : '';
  const m = mode || getApiMode();

  if (m === 'odcloud') {
    if (import.meta.env.DEV) {
      return `/__odcloud_proxy${p}${q}`;
    }
    const origin = (import.meta.env.VITE_REB_APT_ODCLOUD_ORIGIN || 'https://api.odcloud.kr').replace(/\/$/, '');
    return `${origin}${p}${q}`;
  }

  if (import.meta.env.DEV) {
    return `/__public_data_go_proxy${p}${q}`;
  }
  const origin = (import.meta.env.VITE_REB_APT_DATA_GO_ORIGIN || 'https://apis.data.go.kr').replace(/\/$/, '');
  return `${origin}${p}${q}`;
}
