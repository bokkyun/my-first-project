/**
 * FRED 발표일 동기화 + 발표 후 시계열 값 채우기
 * Secrets: FRED_API_KEY (필수), SUPABASE_* 는 호스트에서 주입
 * 호출: 로그인 사용자 JWT (Authorization: Bearer …)
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FRED_BASE = 'https://api.stlouisfed.org/fred';

/** 동일 release_id 는 API 한 번만 호출 */
const RELEASE_GROUPS: {
  release_id: number;
  series: { series_id: string; title: string }[];
}[] = [
  {
    release_id: 10,
    series: [{ series_id: 'CPIAUCSL', title: 'CPI (소비자물가)' }],
  },
  {
    release_id: 21,
    series: [{ series_id: 'M2SL', title: 'M2 통화량' }],
  },
  {
    release_id: 50,
    series: [
      { series_id: 'UNRATE', title: '실업률' },
      { series_id: 'PAYEMS', title: '비농업고용 (NFP)' },
    ],
  },
  {
    release_id: 53,
    series: [{ series_id: 'GDPC1', title: '실질 GDP (연율 환산)' }],
  },
  /** Producer Price Index — BLS, FRED release_id 46 */
  {
    release_id: 46,
    series: [{ series_id: 'PPIFIS', title: 'PPI (생산자물가·최종수요)' }],
  },
  /** Personal Income and Outlays (PCE 물가) — BEA, FRED release_id 54 */
  {
    release_id: 54,
    series: [{ series_id: 'PCEPI', title: 'PCE (개인소비지출 물가)' }],
  },
];

const TRACKED_SERIES_IDS = RELEASE_GROUPS.flatMap((g) => g.series.map((s) => s.series_id));

function todayYmd(): string {
  return new Date().toISOString().slice(0, 10);
}

function ymdAddDays(ymd: string, days: number): string {
  const d = new Date(`${ymd}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

async function fredJson(path: string, params: Record<string, string | number>): Promise<Record<string, unknown>> {
  const key = Deno.env.get('FRED_API_KEY');
  if (!key) throw new Error('FRED_API_KEY 가 Supabase Function secrets 에 없습니다.');
  const u = new URL(`${FRED_BASE}${path}`);
  u.searchParams.set('api_key', key);
  u.searchParams.set('file_type', 'json');
  Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, String(v)));
  const res = await fetch(u.toString());
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`FRED HTTP ${res.status}: ${t.slice(0, 240)}`);
  }
  return res.json() as Promise<Record<string, unknown>>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization 헤더가 없습니다.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const userClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: '로그인이 필요합니다.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const start = ymdAddDays(todayYmd(), -21);
    const end = ymdAddDays(todayYmd(), 420);
    const rows: Record<string, unknown>[] = [];

    for (const g of RELEASE_GROUPS) {
      const data = await fredJson('/release/dates', {
        release_id: g.release_id,
        realtime_start: start,
        realtime_end: end,
        include_release_dates_with_no_data: 'true',
      });
      const dates = (data.release_dates as { date?: string }[]) || [];
      await new Promise((r) => setTimeout(r, 120));
      for (const rd of dates) {
        const dateStr = rd.date;
        if (!dateStr) continue;
        for (const s of g.series) {
          rows.push({
            release_id: g.release_id,
            series_id: s.series_id,
            title: s.title,
            release_date: dateStr,
            status: 'scheduled',
            updated_at: new Date().toISOString(),
          });
        }
      }
    }

    if (rows.length > 0) {
      const { error: upsertErr } = await admin.from('fred_economic_releases').upsert(rows, {
        onConflict: 'release_id,series_id,release_date',
        ignoreDuplicates: true,
      });
      if (upsertErr) throw upsertErr;
    }

    const { error: deleteOldErr } = await admin
      .from('fred_economic_releases')
      .delete()
      .not('series_id', 'in', `(${TRACKED_SERIES_IDS.join(',')})`);
    if (deleteOldErr) throw deleteOldErr;

    for (const g of RELEASE_GROUPS) {
      for (const s of g.series) {
        const { error: titleErr } = await admin
          .from('fred_economic_releases')
          .update({ title: s.title, updated_at: new Date().toISOString() })
          .eq('series_id', s.series_id);
        if (titleErr) throw titleErr;
      }
    }

    const today = todayYmd();
    const { data: needObs, error: selErr } = await admin
      .from('fred_economic_releases')
      .select('id, series_id, release_date')
      .lt('release_date', today)
      .is('actual_value', null);

    if (selErr) throw selErr;

    let filled = 0;
    for (const row of needObs || []) {
      const obsData = await fredJson('/series/observations', {
        series_id: row.series_id,
        observation_start: ymdAddDays(String(row.release_date), -420),
        observation_end: today,
        sort_order: 'desc',
        limit: 2,
      });
      const valid = ((obsData.observations as { date?: string; value?: string }[]) || []).filter(
        (o) => o.value && o.value !== '.',
      );
      await new Promise((r) => setTimeout(r, 120));
      if (valid.length === 0) continue;
      const latest = valid[0];
      const prev = valid.length > 1 ? valid[1] : null;
      const { error: upErr } = await admin
        .from('fred_economic_releases')
        .update({
          actual_value: latest.value,
          previous_value: prev?.value ?? null,
          observation_date: latest.date,
          status: 'released',
          updated_at: new Date().toISOString(),
        })
        .eq('id', row.id);
      if (!upErr) filled += 1;
    }

    return new Response(
      JSON.stringify({
        ok: true,
        upserted_release_rows: rows.length,
        observation_filled: filled,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    console.error(e);
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
