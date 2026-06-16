-- 주식 매매 체결 (HTS/MTS 캡처 AI 파싱 + 실현손익)

create table if not exists public.stock_trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  trade_date date not null,
  market_type text not null check (market_type in ('domestic', 'overseas')),
  ticker text,
  stock_name text,
  trade_type text not null check (trade_type in ('buy', 'sell')),
  quantity numeric not null default 0 check (quantity >= 0),
  price numeric,
  fee numeric not null default 0,
  tax numeric not null default 0,
  currency text not null default 'KRW',
  price_foreign numeric,
  exchange_rate numeric,
  profit_krw numeric,
  buy_trade_id uuid references public.stock_trades (id) on delete set null,
  raw_text text,
  created_at timestamptz not null default now()
);

create index if not exists stock_trades_user_date_idx
  on public.stock_trades (user_id, trade_date desc);

create index if not exists stock_trades_user_sell_profit_idx
  on public.stock_trades (user_id, trade_type, trade_date)
  where trade_type = 'sell';

alter table public.stock_trades enable row level security;

create policy "stock_trades_select_own"
  on public.stock_trades for select
  using (auth.uid() = user_id);

create policy "stock_trades_insert_own"
  on public.stock_trades for insert
  with check (auth.uid() = user_id);

create policy "stock_trades_update_own"
  on public.stock_trades for update
  using (auth.uid() = user_id);

create policy "stock_trades_delete_own"
  on public.stock_trades for delete
  using (auth.uid() = user_id);
