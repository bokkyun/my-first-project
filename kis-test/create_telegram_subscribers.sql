-- 텔레그램 구독자 테이블
-- Supabase SQL Editor에서 실행하세요

CREATE TABLE IF NOT EXISTS telegram_subscribers (
  id         bigint generated always as identity primary key,
  chat_id    text unique not null,          -- 텔레그램 고유 ID
  username   text,                          -- 텔레그램 @username (없을 수도 있음)
  first_name text,                          -- 이름
  is_active  boolean default true,          -- false = 구독 취소
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS 비활성화 (서버→서비스롤 키로만 접근)
ALTER TABLE telegram_subscribers DISABLE ROW LEVEL SECURITY;

-- 업데이트 시 updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_telegram_subscribers_updated
BEFORE UPDATE ON telegram_subscribers
FOR EACH ROW EXECUTE FUNCTION update_updated_at();
