/**
 * Bank of Korea statistical release schedule fetcher.
 * Source: BOK monthly statistical calendar (public page, no API key required).
 */

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BOK_CALENDAR_URL = 'https://www.bok.or.kr/portal/stats/statsPublictSchdul/listCldr.do';

/** ECOS 웹 SPA 해시 라우팅(통계표 코드로 검색 결과로 이동하는 데 자주 사용) */
function indicatorPortalUrl(statCode: string): string {
  return `https://ecos.bok.or.kr/#/SearchStat/${statCode}`;
}

const TARGETS = [
  {
    code: 'BOK_GDP',
    label: 'GDP 성장률',
    ecos_stat_code: '200Y102',
    ecos_cycle: 'Q',
    matches: ['실질 국내총생산', '국민소득', '국민계정'],
  },
  {
    code: 'BOK_M2',
    label: 'M2 통화량',
    ecos_stat_code: '161Y008',
    ecos_cycle: 'M',
    matches: ['통화 및 유동성'],
  },
  {
    code: 'BOK_HOUSEHOLD_LOANS',
    label: '가계대출 증가율',
    ecos_stat_code: '151Y002',
    ecos_cycle: 'M',
    matches: ['가계대출', '가계신용', '가계부채'],
  },
  {
    code: 'BOK_CPI',
    label: '소비자물가',
    ecos_stat_code: '901Y009',
    ecos_cycle: 'M',
    matches: ['소비자물가지수'],
  },
  {
    code: 'BOK_PPI',
    label: '생산자물가',
    ecos_stat_code: '404Y014',
    ecos_cycle: 'M',
    matches: ['생산자물가지수'],
  },
  {
    code: 'BOK_FX_RESERVES',
    label: '외환보유액',
    ecos_stat_code: '732Y001',
    ecos_cycle: 'M',
    matches: ['외환보유액'],
  },
  {
    code: 'BOK_EXPORT_IMPORT',
    label: '수출입 통계',
    ecos_stat_code: '301Y013',
    ecos_cycle: 'M',
    matches: ['수출입물가지수', '무역지수', '국제수지', '지식서비스 무역통계', '결제통화별 수출입'],
  },
];

function ymd(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function ymdAddDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return ymd(d);
}

function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function fifthBusinessDay(year: number, monthIndex: number): Date {
  const d = new Date(Date.UTC(year, monthIndex, 1, 12));
  let count = 0;
  while (count < 5) {
    const day = d.getUTCDay();
    if (day !== 0 && day !== 6) count += 1;
    if (count < 5) d.setUTCDate(d.getUTCDate() + 1);
  }
  return d;
}

function listMonths(startYmd: string, endYmd: string): string[] {
  const start = new Date(`${startYmd}T12:00:00Z`);
  start.setUTCMonth(start.getUTCMonth() - 1, 1);
  const end = new Date(`${endYmd}T12:00:00Z`);
  end.setUTCMonth(end.getUTCMonth() + 1, 1);
  const months: string[] = [];
  for (
    const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1, 12));
    cursor <= end;
    cursor.setUTCMonth(cursor.getUTCMonth() + 1)
  ) {
    months.push(monthKey(cursor));
  }
  return [...new Set(months)];
}

function decodeHtml(value: string): string {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#40;/g, '(')
    .replace(/&#41;/g, ')')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');
}

function stripHtml(value: string): string {
  return decodeHtml(value)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function categorize(title: string): { code: string; label: string; ecos_stat_code: string; ecos_cycle: string } | null {
  const target = TARGETS.find((t) => t.matches.some((keyword) => title.includes(keyword)));
  return target
    ? {
      code: target.code,
      label: target.label,
      ecos_stat_code: target.ecos_stat_code,
      ecos_cycle: target.ecos_cycle,
    }
    : null;
}

function extractCells(rowHtml: string): string[] {
  return [...rowHtml.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((m) => stripHtml(m[1]));
}

async function fetchCalendarMonth(month: string): Promise<Record<string, unknown>[]> {
  const url = new URL(BOK_CALENDAR_URL);
  url.searchParams.set('menuNo', '200775');
  url.searchParams.set('date', month);

  const res = await fetch(url.toString(), {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
    },
  });
  if (!res.ok) throw new Error(`BOK calendar HTTP ${res.status}: ${url}`);

  const bytes = await res.arrayBuffer();
  const html = new TextDecoder('utf-8').decode(bytes);

  const rows: Record<string, unknown>[] = [];
  for (const rowMatch of html.matchAll(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi)) {
    const cells = extractCells(rowMatch[0]);
    if (cells.length < 3) continue;
    const releaseDate = cells[0];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(releaseDate)) continue;
    const releaseTime = cells[1] || null;
    const title = cells[2];
    const category = categorize(title);
    if (!category) continue;

    const calendarUrl = `${BOK_CALENDAR_URL}?menuNo=200775&date=${releaseDate.slice(0, 7)}`;
    const indicatorUrl = indicatorPortalUrl(category.ecos_stat_code);
    const today = ymd(new Date());
    rows.push({
      id: `bok-${category.code}-${releaseDate}-${title}`,
      category_code: category.code,
      category_label: category.label,
      ecos_stat_code: category.ecos_stat_code,
      ecos_cycle: category.ecos_cycle,
      title,
      release_date: releaseDate,
      release_time: releaseTime,
      status: releaseDate < today ? 'released' : 'scheduled',
      calendar_url: calendarUrl,
      indicator_url: indicatorUrl,
      source_url: calendarUrl,
      source_label: '한국은행 공표일정 보기',
      indicator_label: 'ECOS 통계표·시계열',
      source_name: '한국은행',
    });
  }
  return rows;
}

function buildFxReserveEvents(startYmd: string, endYmd: string): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];
  const today = ymd(new Date());
  for (const month of listMonths(startYmd, endYmd)) {
    const [year, monthNum] = month.split('-').map(Number);
    const releaseDate = ymd(fifthBusinessDay(year, monthNum - 1));
    if (releaseDate < startYmd || releaseDate > endYmd) continue;
    rows.push({
      id: `bok-BOK_FX_RESERVES-${releaseDate}`,
      category_code: 'BOK_FX_RESERVES',
      category_label: '외환보유액',
      ecos_stat_code: '732Y001',
      ecos_cycle: 'M',
      title: `${year}년 ${monthNum}월 외환보유액(예정)`,
      release_date: releaseDate,
      release_time: null,
      status: releaseDate < today ? 'released' : 'scheduled',
      calendar_url: 'https://www.bok.or.kr/portal/stats/statsPublictSchdul/listCldr.do?menuNo=200775',
      indicator_url: indicatorPortalUrl('732Y001'),
      source_url:
        'https://www.bok.or.kr/portal/bbs/B0000502/list.do?menuNo=201265&searchCnd=1&searchKwd=%EC%99%B8%ED%99%98%EB%B3%B4%EC%9C%A0%EC%95%A1',
      source_label: '한국은행 외환보유액 보도자료',
      indicator_label: 'ECOS 통계표·시계열',
      source_name: '한국은행',
    });
  }
  return rows;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const today = ymd(new Date());
    const start = typeof body.start === 'string' ? body.start : ymdAddDays(today, -31);
    const end = typeof body.end === 'string' ? body.end : ymdAddDays(today, 370);
    const seen = new Set<string>();
    const releases: Record<string, unknown>[] = [];

    const months = listMonths(start, end);
    const monthErrors: string[] = [];
    /** 순차 호출 대신 소량 병렬로 총 지연 단축 (BOK 부하 고려해 청크 크기 제한) */
    const CHUNK = 5;
    for (let i = 0; i < months.length; i += CHUNK) {
      const batch = months.slice(i, i + CHUNK);
      const settled = await Promise.allSettled(batch.map((m) => fetchCalendarMonth(m)));
      settled.forEach((res, j) => {
        const month = batch[j];
        if (res.status === 'fulfilled') {
          for (const row of res.value) {
            const date = String(row.release_date);
            if (date < start || date > end) continue;
            const key = `${row.category_code}\u0001${row.release_date}\u0001${row.title}`;
            if (seen.has(key)) continue;
            seen.add(key);
            releases.push(row);
          }
        } else {
          const reason = res.reason;
          const line = reason instanceof Error ? reason.message : String(reason);
          monthErrors.push(`${month}: ${line}`);
          console.error(`fetch-bok-releases month ${month}`, reason);
        }
      });
    }
    for (const row of buildFxReserveEvents(start, end)) {
      const key = `${row.category_code}\u0001${row.release_date}\u0001${row.title}`;
      if (seen.has(key)) continue;
      seen.add(key);
      releases.push(row);
    }

    releases.sort((a, b) => String(a.release_date).localeCompare(String(b.release_date)));

    /** 비어 있고 월별 요청이 모두 실패한 경우에만 error — UI가 non-2xx 대신 본문으로 안내 */
    if (releases.length === 0 && monthErrors.length > 0) {
      return new Response(
        JSON.stringify({
          ok: false,
          releases: [],
          error: monthErrors.slice(0, 5).join(' | '),
          hint:
            '한국은행 공표일정 페이지 접근이 차단되었거나 HTML 형식이 바뀌었을 수 있습니다. Supabase Edge Function 로그를 확인하세요.',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({
        ok: true,
        releases,
        ...(monthErrors.length > 0 ? { warnings: monthErrors.slice(0, 3) } : {}),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    console.error(e);
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(
      JSON.stringify({
        ok: false,
        releases: [],
        error: msg,
        hint: 'fetch-bok-releases 내부 오류입니다. Supabase Edge Function 로그를 확인해 주세요.',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
