/**
 * 금융감독원 전자공시 Open DART — 공시 목록 API
 * @see https://opendart.fss.or.kr/
 *
 * 공모·IPO에 쓰는 조합: pblntf_ty=C(발행공시), pblntf_detail_ty=C001(증권신고·지분증권)
 * ※ Open DART 공식: F=외부감사관련 (증권신고 아님). Claude 등이 F를 증권신고로 안내한 경우 오류입니다.
 * `rcept_dt`: 공시 접수일(캘린더 일정일)
 *
 * 인증키는 VITE_DART_CRTFC_KEY (절대 소스에 하드코딩하지 않음)
 */

function ymd8(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

/** 보이는 달 [start, end] Date (시간 무시) */
export function getMonthRangeYmd8(start, end) {
  const a = ymd8(start);
  const b = ymd8(end);
  return a <= b ? { bgn_de: a, end_de: b } : { bgn_de: b, end_de: a };
}

function parseRceptYmdToIso(ymd8) {
  if (!ymd8 || String(ymd8).length < 8) return null;
  const s = String(ymd8).replace(/\D/g, '');
  if (s.length < 8) return null;
  const y = s.slice(0, 4);
  const m = s.slice(4, 6);
  const d = s.slice(6, 8);
  return `${y}-${m}-${d}T00:00:00`;
}

function rceptYmdToIsoEnd(ymd8) {
  const start = parseRceptYmdToIso(ymd8);
  if (!start) return null;
  const dt = new Date(start);
  dt.setHours(23, 59, 59, 999);
  return dt.toISOString();
}

/**
 * @param {object} row — API list 항목
 * @param {number} index
 * @returns {object|null} 캘린더 이벤트 형태
 */
/**
 * 발행공시(C001) 응답에 끼는 잡음만 제거. (보고서명 표기가 환경마다 달라
 * '증권신고' 미포함 행을 전부 버리면 캘린더가 비는 경우가 있음)
 */
export function isDartIpoSecuritiesRegistrationRow(row) {
  const nm = row && row.report_nm != null ? String(row.report_nm) : '';
  if (nm.includes('증권발행실적')) return false;
  if (nm.includes('소액공모실적')) return false;
  return true;
}

export function mapDartListItemToCalendarEvent(row, index) {
  if (!row || typeof row !== 'object') return null;
  if (!isDartIpoSecuritiesRegistrationRow(row)) return null;
  const rcept = row.rcept_dt != null ? String(row.rcept_dt).trim() : '';
  if (!rcept) return null;
  const starts = parseRceptYmdToIso(rcept);
  if (!starts) return null;
  const ends = rceptYmdToIsoEnd(rcept) || starts;
  const corp = String(row.corp_name || row.flr_nm || '기업').trim() || '기업';
  const rno = row.rcept_no != null ? String(row.rcept_no) : `i${index}`;
  const id = `dart-ipo-${rno.replace(/[^a-zA-Z0-9-_]/g, '_')}`.slice(0, 90);

  return {
    id,
    title: `📈 ${corp}`,
    starts_at: starts,
    ends_at: ends,
    is_all_day: true,
    color: '#1b5e20',
    _external: 'ipo',
    _dartRaw: row,
    creator_id: null,
    creatorNickname: '금감원·Open DART',
  };
}

export function buildDartListQuery(viewStart, viewEnd) {
  const key = (import.meta.env.VITE_DART_CRTFC_KEY || '').trim();
  const { bgn_de, end_de } = getMonthRangeYmd8(viewStart, viewEnd);
  const pblntfTy = (import.meta.env.VITE_DART_PBLNTF_TY || 'C').trim() || 'C';
  const detailTy = (import.meta.env.VITE_DART_PBLNTF_DETAIL_TY || 'C001').trim() || 'C001';
  const pageCount = String(import.meta.env.VITE_DART_PAGE_COUNT || '100');
  const q = new URLSearchParams({
    crtfc_key: key,
    pblntf_ty: pblntfTy,
    pblntf_detail_ty: detailTy,
    bgn_de,
    end_de,
    page_no: '1',
    page_count: pageCount,
  });
  return { query: q.toString(), keyPresent: Boolean(key) };
}

/**
 * @returns {string} list.json 풀 URL (쿼리는 별도)
 */
export function dartListPath() {
  return '/api/list.json';
}

/**
 * @param {string} path — `/api/list.json`
 * @param {string} query — `crtfc_key=...`
 */
export function toDartAbsoluteUrl(path, query) {
  const p = path.startsWith('/') ? path : `/${path}`;
  const q = query && !query.startsWith('?') ? `?${query}` : (query || '');
  if (import.meta.env.DEV) {
    return `/__opendart_proxy${p}${q}`;
  }
  const origin = (import.meta.env.VITE_DART_OPENDART_ORIGIN || 'https://opendart.fss.or.kr')
    .replace(/\/$/, '');
  return `${origin}${p}${q}`;
}

/**
 * DART list.json 응답 파싱
 */
export function parseDartListResponse(json) {
  if (!json || typeof json !== 'object') {
    return { list: [], error: '빈 응답입니다.', totalPage: 0 };
  }
  if (String(json.status) !== '000') {
    return {
      list: [],
      error: String(json.message || 'API 오류'),
      totalPage: 0,
    };
  }
  const list = Array.isArray(json.list) ? json.list : [];
  const totalPage = Number(json.total_page) || 1;
  return { list, error: null, totalPage };
}

/**
 * 여러 페이지 수집 (최대 maxPages)
 * @param {string} path
 * @param {{ bgn_de: string, end_de: string }} ymd
 * @param {number} [maxPages=20]
 * @param {(page:number)=>Promise<Response>} [fetchImpl]
 */
export async function fetchDartListAllPages(path, ymd, maxPages = 20, fetchImpl = fetch) {
  const key = (import.meta.env.VITE_DART_CRTFC_KEY || '').trim();
  if (!key) {
    return { items: [], error: 'DART API 인증키가 없습니다. VITE_DART_CRTFC_KEY 를 설정하세요.' };
  }
  const pblntfTy = (import.meta.env.VITE_DART_PBLNTF_TY || 'C').trim() || 'C';
  const detailTy = (import.meta.env.VITE_DART_PBLNTF_DETAIL_TY || 'C001').trim() || 'C001';
  const pageCount = String(import.meta.env.VITE_DART_PAGE_COUNT || '100');
  const all = [];
  let pageNo = 1;
  let totalPage = 1;

  do {
    const q = new URLSearchParams({
      crtfc_key: key,
      pblntf_ty: pblntfTy,
      pblntf_detail_ty: detailTy,
      bgn_de: ymd.bgn_de,
      end_de: ymd.end_de,
      page_no: String(pageNo),
      page_count: pageCount,
    });
    const url = toDartAbsoluteUrl(path, q.toString());
    const res = await fetchImpl(url, { method: 'GET' });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { items: [], error: `HTTP ${res.status}` };
    }
    const parsed = parseDartListResponse(json);
    if (parsed.error) {
      return { items: all, error: parsed.error };
    }
    all.push(...parsed.list);
    totalPage = parsed.totalPage;
    pageNo += 1;
  } while (pageNo <= totalPage && pageNo <= maxPages);

  return { items: all, error: null };
}
