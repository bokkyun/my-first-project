/**
 * Bank of Korea statistical release schedule fetcher.
 * Source: BOK monthly statistical calendar (public page, no API key required).
 */

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BOK_CALENDAR_URL = 'https://www.bok.or.kr/portal/stats/statsPublictSchdul/listCldr.do';

const TARGETS = [
  {
    code: 'BOK_GDP',
    label: 'GDP 성장률',
    matches: ['실질 국내총생산', '국민소득', '국민계정'],
  },
  {
    code: 'BOK_M2',
    label: 'M2 통화량',
    matches: ['통화 및 유동성'],
  },
  {
    code: 'BOK_HOUSEHOLD_LOANS',
    label: '가계대출 증가율',
    matches: ['가계대출', '가계신용', '가계부채'],
  },
  {
    code: 'BOK_CPI',
    label: '소비자물가',
    matches: ['소비자물가지수'],
  },
  {
    code: 'BOK_PPI',
    label: '생산자물가',
    matches: ['생산자물가지수'],
  },
  {
    code: 'BOK_FX_RESERVES',
    label: '외환보유액',
    matches: ['외환보유액'],
  },
  {
    code: 'BOK_EXPORT_IMPORT',
    label: '수출입 통계',
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

function categorize(title: string): { code: string; label: string } | null {
  const target = TARGETS.find((t) => t.matches.some((keyword) => title.includes(keyword)));
  return target ? { code: target.code, label: target.label } : null;
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
      'User-Agent': 'MoneyCal/1.0 BOK calendar fetcher',
      Accept: 'text/html,application/xhtml+xml',
    },
  });
  if (!res.ok) throw new Error(`BOK calendar HTTP ${res.status}`);

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

    const sourceUrl = `${BOK_CALENDAR_URL}?menuNo=200775&date=${releaseDate.slice(0, 7)}`;
    const today = ymd(new Date());
    rows.push({
      id: `bok-${category.code}-${releaseDate}-${title}`,
      category_code: category.code,
      category_label: category.label,
      title,
      release_date: releaseDate,
      release_time: releaseTime,
      status: releaseDate < today ? 'released' : 'scheduled',
      source_url: sourceUrl,
      source_label: '한국은행 공표일정 보기',
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
      title: `${year}년 ${monthNum}월 외환보유액(예정)`,
      release_date: releaseDate,
      release_time: null,
      status: releaseDate < today ? 'released' : 'scheduled',
      source_url: 'https://www.bok.or.kr/portal/bbs/B0000502/list.do?menuNo=201265&searchCnd=1&searchKwd=%EC%99%B8%ED%99%98%EB%B3%B4%EC%9C%A0%EC%95%A1',
      source_label: '한국은행 외환보유액 보도자료',
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

    for (const month of listMonths(start, end)) {
      const rows = await fetchCalendarMonth(month);
      for (const row of rows) {
        const date = String(row.release_date);
        if (date < start || date > end) continue;
        const key = `${row.category_code}\u0001${row.release_date}\u0001${row.title}`;
        if (seen.has(key)) continue;
        seen.add(key);
        releases.push(row);
      }
    }
    for (const row of buildFxReserveEvents(start, end)) {
      const key = `${row.category_code}\u0001${row.release_date}\u0001${row.title}`;
      if (seen.has(key)) continue;
      seen.add(key);
      releases.push(row);
    }

    releases.sort((a, b) => String(a.release_date).localeCompare(String(b.release_date)));
    return new Response(JSON.stringify({ ok: true, releases }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error(e);
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
