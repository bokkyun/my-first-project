-- FRED(연준·세인트루이스 연은) 거시지표 발표일·수치 — 캘린더 연동
-- 데이터 쓰기: Edge Function sync-fred-releases + service_role 만 (클라이언트는 SELECT)
--
-- 배포 후:
--   1) supabase db push (또는 SQL 에디터에 붙여 실행)
--   2) supabase secrets set FRED_API_KEY=여기에_FRED_API_키
--   3) supabase functions deploy sync-fred-releases
-- FRED 키: https://fred.stlouisfed.org/docs/api/api_key.html
-- 추적 지표:
--   PAYEMS(NFP), CPIAUCSL(CPI), DFEDTARU(FOMC 기준금리 상단), GDPC1(GDP), UNRATE(실업률)

create table if not exists public.fred_economic_releases (
  id uuid primary key default gen_random_uuid(),
  release_id integer not null,
  series_id text not null,
  title text not null,
  release_date date not null,
  actual_value text,
  previous_value text,
  observation_date date,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'released')),
  updated_at timestamptz not null default now(),
  unique (release_id, series_id, release_date)
);

create index if not exists idx_fred_economic_releases_release_date
  on public.fred_economic_releases (release_date);

comment on table public.fred_economic_releases is
  'FRED API 동기화 거시지표 발표일(및 발표 후 시계열 값). 쓰기는 Edge Function만.';

alter table public.fred_economic_releases enable row level security;

create policy "fred_economic_releases_select_authenticated"
  on public.fred_economic_releases
  for select
  to authenticated
  using (true);
