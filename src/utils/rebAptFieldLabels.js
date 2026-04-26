/**
 * 청약홈(ODcloud Applyhome) 응답 필드 → 한글 라벨
 * (공식 스키마 일부; 미등록 키는 키 문자열을 그대로 씀)
 */
export const REB_ODCLOUD_FIELD_LABELS = {
  // 위치·명칭
  HOUSE_NM: '주택명',
  HSMP_NM: '단지명',
  PBLANC_NM: '공고명',
  SPLY_HSMP_NM: '공급단지명',
  HSSPLY_HSMP_NM: '공급주택명',
  BIZ_NM: '사업명',
  SPLY_BIZ_NM: '공급사업명',
  BLDG_NM: '동·건물',
  주택명: '주택명',
  아파트명: '아파트명',
  사업명: '사업명',
  HSSPLY_ADRES: '공급위치(주소)',
  주소: '주소',
  CTPRVN_NM: '시·도',
  SIGNGU_NM: '시·군·구',
  TELNO: '문의전화',
  FAX: '팩스',
  HMPG_ADRES: '홈페이지',
  PBLANC_URL: '공고 URL',

  // 번호
  PBLANC_NO: '공고번호',
  HOUSE_MGMT_NO: '주택관리번호',
  HSMP_MGMT_NO: '단지관리번호',
  공고번호: '공고번호',
  주택관리번호: '주택관리번호',

  // 사업·시행
  BSNS_MBY_NM: '사업주체',
  CNSTRCT_ENTRPS_NM: '시공사',
  MDAT_TELNO: '정비사업전화',
  CSTRN_WRKNDE: '착공일',
  CSTRN_COMPLNDE: '준공(예정)일',

  // 접수
  RCEPT_BGNDE: '청약접수 시작일',
  RCEPT_ENDDE: '청약접수 마감일',
  SPLY_RCEPT_BGNDE: '공급·접수 시작일',
  SPLY_RCEPT_ENDDE: '공급·접수 마감일',
  SPLY_RCEPT_STTDE: '공급접수기간(시작)',
  SPLY_RCEPT_CLSDE: '공급접수기간(마감)',
  SUBSCR_LMT: '청약(주택형)한도',
  MNVL: '최소연령(만)',
  MNVL2: '최대연령(만)',

  // 지역·순위별 접수(일부 API)
  GNRL_RNK1_CRSPAREA_RCPTDE: '1순위(해당지역) 접수일',
  GNRL_RNK1_CRSPAREA_ENDDE: '1순위(해당지역) 마감일',
  GNRL_RNK1_ETC_AREA_ENDDE: '1순위(기타지역) 마감일',
  PRTTN_RCEPT_BGNDE: '특별공급 접수시작',
  PRTTN_RCEPT_ENDDE: '특별공급 접수마감',

  // 계약
  CNTRCT_CNCLS_BGNDE: '계약체결 시작일',
  CNTRCT_CNCLS_ENDDE: '계약체결 마감일',

  // 기타(드물게 노출)
  SPLY_HSHLDCO: '공급세대수',
  TOTAR: '면적(㎡)',
  RCPT_MTHD: '접수방법',
  INTRC_DEAL_TELNO: '입주(분양)문의',
};

const SUMMARY_CANDIDATES = [
  // [표시용 슬롯, 후보 키(우선순)] — raw에 있는 첫 비어 있지 않은 값 사용
  ['명칭', ['주택명', 'HOUSE_NM', 'HSMP_NM', 'PBLANC_NM', 'SPLY_HSMP_NM', 'HSSPLY_HSMP_NM', '사업명', 'BIZ_NM', 'SPLY_BIZ_NM', 'BLDG_NM', '아파트명']],
  ['위치/주소', ['HSSPLY_ADRES', '주소', 'CTPRVN_NM', 'SIGNGU_NM']],
  ['접수기간(시작)', ['RCEPT_BGNDE', 'SPLY_RCEPT_BGNDE', 'SPLY_RCEPT_STTDE', '접수시작일', '청약접수시작일']],
  ['접수기간(마감)', ['RCEPT_ENDDE', 'SPLY_RCEPT_ENDDE', 'SPLY_RCEPT_CLSDE', '접수마감일', '접수종료일']],
  ['공고/관리번호', ['PBLANC_NO', '공고번호', 'HOUSE_MGMT_NO', 'HSMP_MGMT_NO', '주택관리번호']],
  ['사업주체', ['BSNS_MBY_NM']],
  ['시공사', ['CNSTRCT_ENTRPS_NM']],
  ['문의', ['TELNO', 'MDAT_TELNO', 'INTRC_DEAL_TELNO']],
  ['홈페이지', ['HMPG_ADRES', 'PBLANC_URL']],
];

/**
 * @param {string} key
 * @returns {string}
 */
export function rebAptFieldLabel(key) {
  if (key == null || key === '') return '';
  if (REB_ODCLOUD_FIELD_LABELS[key]) return REB_ODCLOUD_FIELD_LABELS[key];
  return String(key);
}

/**
 * @param {Record<string, unknown>} raw
 * @returns {{ label: string, value: string, key: string }[]}
 */
export function getRebAptSummaryRows(raw) {
  if (!raw || typeof raw !== 'object') return [];
  const t = (k) => (raw[k] != null && String(raw[k]).trim() !== '' ? String(raw[k]).trim() : '');

  const out = [];
  for (const [, keys] of SUMMARY_CANDIDATES) {
    for (const k of keys) {
      const v = t(k);
      if (v) {
        out.push({
          key: k,
          label: rebAptFieldLabel(k),
          value: v,
        });
        break;
      }
    }
  }
  return out;
}

/**
 * @param {Record<string, unknown>} raw
 * @returns {{ k: string, label: string, v: string }[]}
 */
export function getRebAptLabeledRows(raw) {
  if (!raw || typeof raw !== 'object') return [];
  const used = new Set();
  const summary = getRebAptSummaryRows(raw);
  summary.forEach((r) => used.add(r.key));

  const rest = Object.entries(raw)
    .filter(([, v]) => v != null && String(v).trim() !== '')
    .map(([k, v]) => ({ k, v: String(v) }))
    .filter(({ k }) => !used.has(k))
    .sort((a, b) => {
      const la = rebAptFieldLabel(a.k);
      const lb = rebAptFieldLabel(b.k);
      return la.localeCompare(lb, 'ko');
    });

  const summaryAsRows = summary.map((r) => ({
    k: r.key,
    label: r.label,
    v: r.value,
  }));

  return [
    ...summaryAsRows,
    ...rest.map(({ k, v }) => ({ k, label: rebAptFieldLabel(k), v })),
  ];
}

/**
 * 다이얼로그용: 위 요약(중복 없음) + 나머지 필드(가나다순)
 * @param {Record<string, unknown>} raw
 * @returns {{ summary: { k: string, label: string, v: string }[], rest: { k: string, label: string, v: string }[]}}
 */
export function getRebAptDialogSections(raw) {
  if (!raw || typeof raw !== 'object') {
    return { summary: [], rest: [] };
  }
  const summary = getRebAptSummaryRows(raw).map((r) => ({
    k: r.key,
    label: r.label,
    v: r.value,
  })); // getRebAptSummaryRows: { key, label, value }
  const used = new Set(summary.map((r) => r.k));
  const rest = Object.entries(raw)
    .filter(([, v]) => v != null && String(v).trim() !== '')
    .map(([k, v]) => ({ k, v: String(v) }))
    .filter(({ k }) => !used.has(k))
    .sort((a, b) => rebAptFieldLabel(a.k).localeCompare(rebAptFieldLabel(b.k), 'ko'))
    .map(({ k, v }) => ({ k, label: rebAptFieldLabel(k), v }));
  return { summary, rest };
}
