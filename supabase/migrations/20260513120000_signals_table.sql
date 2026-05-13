-- signals 테이블 생성
-- 기술적 지표 매수신호(MACD·RSI·볼린저 등)를 날짜/종목/신호유형별로 저장
--
-- 적용 방법 (선택 1): Supabase 대시보드 → SQL Editor 에 붙여넣고 실행
-- 적용 방법 (선택 2): supabase link 후 supabase db push

CREATE TABLE IF NOT EXISTS public.signals (
  id              BIGSERIAL    PRIMARY KEY,
  date            DATE         NOT NULL,
  code            TEXT         NOT NULL,
  name            TEXT,
  market          TEXT,
  signal_type     TEXT         NOT NULL,
  signal_category TEXT,
  signal_name     TEXT,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- (date, code, signal_type) 조합 중복 방지 — upsert 기준
ALTER TABLE public.signals
  DROP CONSTRAINT IF EXISTS signals_date_code_signal_type_key;
ALTER TABLE public.signals
  ADD CONSTRAINT signals_date_code_signal_type_key
  UNIQUE (date, code, signal_type);

-- 날짜 범위 조회 인덱스 (캘린더 뷰가 날짜 범위로 조회)
CREATE INDEX IF NOT EXISTS signals_date_idx    ON public.signals (date);
CREATE INDEX IF NOT EXISTS signals_code_idx    ON public.signals (code);
CREATE INDEX IF NOT EXISTS signals_type_idx    ON public.signals (signal_type);

-- RLS 활성화
ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;

-- 누구나(비로그인 포함) 읽기 허용 — 캘린더 게스트 모드 지원
DROP POLICY IF EXISTS "signals_select_all" ON public.signals;
CREATE POLICY "signals_select_all"
  ON public.signals
  FOR SELECT
  USING (true);

-- 쓰기는 service_role 전용 (스캐너 서버가 service_role 키로 접근)
-- service_role 은 RLS 를 우회하므로 INSERT/UPSERT 별도 정책 불필요
