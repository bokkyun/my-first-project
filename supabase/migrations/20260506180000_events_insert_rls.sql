-- events INSERT 시 RLS 오류 방지
-- 증상: new row violates row-level security policy for table 'events'
--
-- 적용: Supabase 대시보드 → SQL Editor 에서 실행하거나,
--       로컬에서 supabase link 후 supabase db push
--
-- 앱 동작 요약 (src/hooks/useEvents.js):
-- - 일반 저장: creator_id = 로그인 사용자(auth.uid())
-- - 그룹 관리자가 멤버 대신 등록: creator_id = 해당 멤버 UUID

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- 본인 명의로 일정 등록
DROP POLICY IF EXISTS "moneycal_events_insert_own" ON public.events;
CREATE POLICY "moneycal_events_insert_own"
ON public.events
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = creator_id);

-- 같은 그룹의 관리자가 멤버 대신 등록 (등록 대상 드롭다운)
DROP POLICY IF EXISTS "moneycal_events_insert_admin_delegate" ON public.events;
CREATE POLICY "moneycal_events_insert_admin_delegate"
ON public.events
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.group_members AS admin_gm
    INNER JOIN public.group_members AS target_gm
      ON target_gm.group_id = admin_gm.group_id
    WHERE admin_gm.user_id = auth.uid()
      AND admin_gm.role = 'admin'
      AND target_gm.user_id = creator_id
  )
);
