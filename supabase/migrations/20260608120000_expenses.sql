-- 영수증/지출 기록 (OpenRouter AI 파싱 결과 저장)

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  amount numeric not null check (amount >= 0),
  merchant text,
  items jsonb not null default '[]'::jsonb,
  category text,
  source_type text,
  raw_text text,
  created_at timestamptz not null default now()
);

create index if not exists expenses_user_id_date_idx
  on public.expenses (user_id, date desc);

alter table public.expenses enable row level security;

create policy "expenses_select_own"
  on public.expenses for select
  using (auth.uid() = user_id);

create policy "expenses_insert_own"
  on public.expenses for insert
  with check (auth.uid() = user_id);

create policy "expenses_update_own"
  on public.expenses for update
  using (auth.uid() = user_id);

create policy "expenses_delete_own"
  on public.expenses for delete
  using (auth.uid() = user_id);
