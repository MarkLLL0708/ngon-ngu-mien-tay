ALTER TABLE public.companions
  ADD COLUMN IF NOT EXISTS persona_gender text NOT NULL DEFAULT 'female',
  ADD COLUMN IF NOT EXISTS address_self text NOT NULL DEFAULT 'mình',
  ADD COLUMN IF NOT EXISTS address_other text NOT NULL DEFAULT 'bạn',
  ADD COLUMN IF NOT EXISTS persona_style text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS job text NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS public.companion_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  companion_id uuid NOT NULL REFERENCES public.companions(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, DELETE ON public.companion_messages TO authenticated;
GRANT ALL ON public.companion_messages TO service_role;

ALTER TABLE public.companion_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Người dùng xem tin nhắn của mình" ON public.companion_messages
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Người dùng tạo tin nhắn của mình" ON public.companion_messages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Người dùng xóa tin nhắn của mình" ON public.companion_messages
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS companion_messages_thread_idx
  ON public.companion_messages (companion_id, created_at);
CREATE INDEX IF NOT EXISTS companion_messages_user_day_idx
  ON public.companion_messages (user_id, created_at);