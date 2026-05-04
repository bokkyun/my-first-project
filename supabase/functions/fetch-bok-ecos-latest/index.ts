/**
 * ECOS Open API(StatisticSearch)로 한국은행 일정 카테고리별 최근 시계열 값을 조회합니다.
 * Secrets: BOK_ECOS_API_KEY (필수 — ecos.bok.or.kr Open API 인증키)
 */

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Cycle = 'M' | 'Q';

const ECOS_MAP: Record<string, { stat: string; cycle: Cycle; item1Candidates: string[] }> = {
  BOK_GDP: { stat: '200Y102', cycle: 'Q', item1Candidates: ['', '0', '10101', '9010101'] },
  BOK_M2: { stat: '161Y008', cycle: 'M', item1Candidates: ['', '0', 'BBG00'] },
  BOK_HOUSEHOLD_LOANS: { stat: '151Y002', cycle: 'M', item1Candidates: ['', '0', '0100000'] },
  BOK_CPI: { stat: '901Y009', cycle: 'M', item1Candidates: ['', '0', '000000001'] },
  BOK_PPI: { stat: '404Y014', cycle: 'M', item1Candidates: ['', '0', '10000'] },
  BOK_FX_RESERVES: { stat: '732Y001', cycle: 'M', item1Candidates: ['', '0', '000000001'] },
  BOK_EXPORT_IMPORT: { stat: '301Y013', cycle: 'M', item1Candidates: ['', '0', '000000001', '299000000'] },
};

function ymFromYmd(ymd: string): { y: number; m: number } {
  const [ys, ms] = ymd.split('-').map(Number);
  return { y: ys, m: ms || 1 };
}

function yyyyMM(y: number, m: number): string {
  return `${y}${String(m).padStart(2, '0')}`;
}

function addMonths(y: number, m: number, delta: number): { y: number; m: number } {
  const idx = y * 12 + (m - 1) + delta;
  return { y: Math.floor(idx / 12), m: (idx % 12) + 1 };
}

function monthRange(endYmd: string): { start: string; end: string } {
  const { y, m } = ymFromYmd(endYmd);
  const end = yyyyMM(y, m);
  const s = addMonths(y, m, -11);
  return { start: yyyyMM(s.y, s.m), end };
}

function quarterRange(endYmd: string): { start: string; end: string } {
  const { y, m } = ymFromYmd(endYmd);
  const q = Math.floor((m - 1) / 3) + 1;
  const end = `${y}Q${q}`;
  const totalQ = y * 4 + q - 1;
  const startTotal = totalQ - 7;
  const sy = Math.floor(startTotal / 4);
  const sq = (startTotal % 4) + 1;
  const start = `${sy}Q${sq}`;
  return { start, end };
}

function buildSearchUrl(
  apiKey: string,
  statCode: string,
  cycle: Cycle,
  startDate: string,
  endDate: string,
  items: [string, string, string, string],
): string {
  const [i1, i2, i3, i4] = items;
  const segs = ['StatisticSearch', apiKey, 'json', 'kr', '1', '100', statCode, cycle, startDate, endDate, i1, i2, i3, i4];
  return `https://ecos.bok.or.kr/api/${segs.join('/')}`;
}

function pickRows(payload: unknown): Record<string, string>[] {
  if (!payload || typeof payload !== 'object') return [];
  const obj = payload as Record<string, unknown>;
  const block = obj.StatisticSearch ?? obj.statisticSearch;
  if (!block || typeof block !== 'object') return [];
  const row = (block as Record<string, unknown>).row;
  if (!row) return [];
  return Array.isArray(row) ? row as Record<string, string>[] : [row as Record<string, string>];
}

function normalizeRow(r: Record<string, string>): {
  time: string;
  value: string;
  unit?: string;
  itemName?: string;
} {
  const time = r.TIME ?? r.time ?? '';
  const value = r.DATA_VALUE ?? r.data_value ?? r.VAL ?? '';
  const unit = r.UNIT_NAME ?? r.unit_name ?? r.UNIT ?? '';
  const itemName = r.ITEM_NAME1 ?? r.item_name1 ?? r.ITEM_NAME ?? '';
  return { time, value, unit, itemName };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('BOK_ECOS_API_KEY')?.trim();
    if (!apiKey) {
      return new Response(JSON.stringify({
        ok: false,
        error: 'missing_bok_ecos_key',
        hint: 'Supabase 대시보드 → Edge Functions → Secrets 에 BOK_ECOS_API_KEY 등록',
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json().catch(() => ({}));
    const categoryCode = typeof body.category_code === 'string' ? body.category_code : '';
    const releaseDate = typeof body.release_date === 'string' ? body.release_date : '';

    const cfg = ECOS_MAP[categoryCode];
    if (!cfg || !releaseDate) {
      return new Response(JSON.stringify({ ok: false, error: 'bad_request' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const dateRange = cfg.cycle === 'M' ? monthRange(releaseDate) : quarterRange(releaseDate);
    let lastErr: string | null = null;

    for (const item1 of cfg.item1Candidates) {
      const items: [string, string, string, string] = [item1 || '', '', '', ''];
      const url = buildSearchUrl(apiKey, cfg.stat, cfg.cycle, dateRange.start, dateRange.end, items);
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      const text = await res.text();
      let json: unknown;
      try {
        json = JSON.parse(text);
      } catch {
        lastErr = `ECOS 응답 파싱 실패 (HTTP ${res.status})`;
        continue;
      }
      const payload = json as Record<string, unknown>;
      const resultBlock = payload.RESULT && typeof payload.RESULT === 'object'
        ? payload.RESULT as Record<string, unknown>
        : null;
      const errCode = resultBlock ? String(resultBlock.CODE ?? '') : '';
      const apiMsg = resultBlock ? String(resultBlock.MESSAGE ?? '') : '';

      const rowsRaw = pickRows(json);
      if (rowsRaw.length === 0) {
        lastErr = apiMsg || errCode || '데이터 행 없음';
        continue;
      }

      const normalized = rowsRaw.map(normalizeRow).filter((r) => r.time && String(r.value).trim() !== '');
      if (!normalized.length) {
        lastErr = apiMsg || errCode || '유효한 값 없음';
        continue;
      }

      normalized.sort((a, b) => a.time.localeCompare(b.time));
      const latest = normalized[normalized.length - 1];

      return new Response(JSON.stringify({
        ok: true,
        stat_code: cfg.stat,
        cycle: cfg.cycle,
        time: latest.time,
        data_value: latest.value,
        unit_name: latest.unit ?? '',
        item_hint: latest.itemName ?? '',
        queried_range: dateRange,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({
      ok: false,
      error: lastErr || 'ecos_fetch_failed',
      stat_code: cfg.stat,
      cycle: cfg.cycle,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
