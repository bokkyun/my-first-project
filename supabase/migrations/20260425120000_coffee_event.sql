-- 커피 주문 이벤트: events.event_kind, coffee_orders
-- Supabase SQL Editor에서 실행하거나, CLI 마이그레이션으로 적용하세요.

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS event_kind text NOT NULL DEFAULT 'default';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'events_event_kind_check'
  ) THEN
    ALTER TABLE public.events
      ADD CONSTRAINT events_event_kind_check
      CHECK (event_kind IN ('default', 'schedule', 'coffee'));
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.coffee_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  menu_type text NOT NULL,
  temperature text,
  custom_text text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT coffee_orders_menu_type_check
    CHECK (menu_type IN ('americano', 'latte', 'matcha_latte', 'macchiato', 'custom')),
  CONSTRAINT coffee_orders_temperature_check
    CHECK (temperature IS NULL OR temperature IN ('ice', 'hot')),
  CONSTRAINT coffee_orders_event_user_unique UNIQUE (event_id, user_id),
  CONSTRAINT coffee_orders_custom_or_fixed CHECK (
    (menu_type = 'custom' AND custom_text IS NOT NULL AND btrim(custom_text) <> '')
    OR
    (menu_type <> 'custom' AND temperature IN ('ice', 'hot'))
  )
);

CREATE INDEX IF NOT EXISTS idx_coffee_orders_event_id ON public.coffee_orders (event_id);

ALTER TABLE public.coffee_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coffee_orders_select_group_or_creator"
  ON public.coffee_orders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.events e WHERE e.id = coffee_orders.event_id AND e.creator_id = (SELECT auth.uid()))
    OR EXISTS (
      SELECT 1
      FROM public.event_visibility ev
      JOIN public.group_members gm ON gm.group_id = ev.group_id
      WHERE ev.event_id = coffee_orders.event_id
        AND gm.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "coffee_orders_insert_self_visible_event"
  ON public.coffee_orders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND (
      EXISTS (SELECT 1 FROM public.events e WHERE e.id = coffee_orders.event_id AND e.creator_id = (SELECT auth.uid()))
      OR EXISTS (
        SELECT 1
        FROM public.event_visibility ev
        JOIN public.group_members gm ON gm.group_id = ev.group_id
        WHERE ev.event_id = coffee_orders.event_id
          AND gm.user_id = (SELECT auth.uid())
      )
    )
  );

CREATE POLICY "coffee_orders_update_own"
  ON public.coffee_orders
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "coffee_orders_delete_own"
  ON public.coffee_orders
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));
