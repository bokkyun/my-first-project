/**
 * 한국부동산원 청약홈 분양정보(공공데이터) — 응답 파싱
 * (오퍼레이션/필드명은 포털 기술문서와 동일·유사. 없으면 VITE_REB_APT_SPLY_PATH 로 조정)
 *
 * @see https://www.data.go.kr (한국부동산원_청약홈 분양정보 조회 서비스)
 */

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
 * data.go.kr 표준 errorXml/json 구조
 */
export function parseRebAptSplyResponse(json) {
  if (!json || typeof json !== 'object') {
    return { items: [], error: '빈 응답입니다.' };
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

/**
 * 단일 분양/청약 item → 캘린더 이벤트(확장 필드)
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

export function buildRebAptSplyListUrl() {
  const key = (import.meta.env.VITE_DATA_GO_KR_SERVICE_KEY || '').trim();
  const serviceKey = key ? `serviceKey=${encodeURIComponent(key)}` : '';
  const pageNo = 'pageNo=1';
  const num = `numOfRows=${import.meta.env.VITE_REB_APT_PAGE_SIZE || 200}`;
  const type = 'resultType=json';
  const path = (import.meta.env.VITE_REB_APT_SPLY_PATH || '/1613000/AptBasisOflsInfoService/getAptBasisOflsList')
    .replace(/^\s+/, '');
  const query = [serviceKey, pageNo, num, type].filter(Boolean).join('&');
  return { path, query, keyPresent: Boolean(key) };
}

/**
 * 개발: Vite 프록시(동일 출처) / 배포: 직접( CORS 이슈 시 서버/리라이트 필요)
 */
export function toDataGoAbsoluteUrl(path, query) {
  const p = path.startsWith('/') ? path : `/${path}`;
  const q = query ? (query.startsWith('?') ? query : `?${query}`) : '';
  if (import.meta.env.DEV) {
    return `/__public_data_go_proxy${p}${q}`;
  }
  const origin = (import.meta.env.VITE_REB_APT_DATA_GO_ORIGIN || 'https://apis.data.go.kr').replace(/\/$/, '');
  return `${origin}${p}${q}`;
}
