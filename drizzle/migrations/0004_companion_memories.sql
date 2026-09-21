CREATE TABLE public.companion_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  companion_id uuid NOT NULL REFERENCES public.companions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fact text NOT NULL,
  category text NOT NULL DEFAULT 'basic',
  pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.companion_memories TO authenticated;
GRANT ALL ON public.companion_memories TO service_role;

ALTER TABLE public.companion_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Người dùng xem trí nhớ của mình" ON public.companion_memories FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Người dùng tạo trí nhớ của mình" ON public.companion_memories FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Người dùng cập nhật trí nhớ của mình" ON public.companion_memories FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Người dùng xóa trí nhớ của mình" ON public.companion_memories FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX companion_memories_companion_idx ON public.companion_memories (companion_id, pinned DESC, created_at DESC);

ALTER TABLE public.companions ADD COLUMN last_message_at timestamptz;
ALTER TABLE public.companions ADD COLUMN last_message_preview text NOT NULL DEFAULT '';
ALTER TABLE public.companions ADD COLUMN welcome_enabled boolean NOT NULL DEFAULT true;

CREATE INDEX companion_messages_companion_created_idx ON public.companion_messages (companion_id, created_at DESC);