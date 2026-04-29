-- 앱 일반 일정은 event_kind='schedule'(EventDialog) — 기존 CHECK(default,coffee)와 불일치 시 INSERT 실패 가능
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_event_kind_check;
ALTER TABLE public.events
  ADD CONSTRAINT events_event_kind_check
  CHECK (event_kind IN ('default', 'schedule', 'coffee'));

-- 같은 이벤트를 연 그룹원이 주문을 바꿀 때 클라에서 실시간 반영 가능하도록
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (
       SELECT 1 FROM pg_publication_tables pt
       WHERE pt.pubname = 'supabase_realtime'
         AND pt.schemaname = 'public'
         AND pt.tablename = 'coffee_orders'
     ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.coffee_orders;
  END IF;
END$$;
