CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  age_confirmed boolean NOT NULL DEFAULT false,
  default_region text,
  default_city text,
  age_group text,
  subscription_status text NOT NULL DEFAULT 'free',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Người dùng xem hồ sơ của mình" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Người dùng tạo hồ sơ của mình" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Người dùng cập nhật hồ sơ của mình" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.companions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  region text NOT NULL,
  age_vibe text NOT NULL,
  personality text NOT NULL,
  mode text NOT NULL,
  memory_summary text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companions TO authenticated;
GRANT ALL ON public.companions TO service_role;
ALTER TABLE public.companions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Người dùng xem nhân vật của mình" ON public.companions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Người dùng tạo nhân vật của mình" ON public.companions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Người dùng cập nhật nhân vật của mình" ON public.companions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Người dùng xóa nhân vật của mình" ON public.companions FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.reply_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  mode text NOT NULL,
  region text NOT NULL,
  city text NOT NULL,
  age_group text NOT NULL,
  input_text text NOT NULL,
  result jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.reply_generations TO authenticated;
GRANT ALL ON public.reply_generations TO service_role;
ALTER TABLE public.reply_generations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Người dùng xem lịch sử của mình" ON public.reply_generations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Người dùng tạo lịch sử của mình" ON public.reply_generations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Người dùng xóa lịch sử của mình" ON public.reply_generations FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX companions_user_created_idx ON public.companions (user_id, created_at DESC);
CREATE INDEX reply_generations_user_created_idx ON public.reply_generations (user_id, created_at DESC);