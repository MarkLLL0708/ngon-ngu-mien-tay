-- Admin allowlist ------------------------------------------------------------
CREATE TABLE public.persona_admins (
  user_id uuid PRIMARY KEY,
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.persona_admins TO authenticated;
GRANT ALL ON public.persona_admins TO service_role;

ALTER TABLE public.persona_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read the admin list"
ON public.persona_admins FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.is_persona_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.persona_admins WHERE user_id = _user_id)
$$;

-- Persona catalogue -----------------------------------------------------------
CREATE TABLE public.personas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL DEFAULT '',
  age_vibe text NOT NULL DEFAULT '',
  region text NOT NULL DEFAULT 'nam',
  city text NOT NULL DEFAULT '',
  job text NOT NULL DEFAULT '',
  persona_gender text NOT NULL DEFAULT 'female',
  personality text NOT NULL DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}',
  backstory text NOT NULL DEFAULT '',
  family text NOT NULL DEFAULT '',
  daily_life text NOT NULL DEFAULT '',
  quirks text NOT NULL DEFAULT '',
  favorite_things text NOT NULL DEFAULT '',
  opinions text NOT NULL DEFAULT '',
  catchphrase text NOT NULL DEFAULT '',
  intro_video_url text NOT NULL DEFAULT '',
  gallery_urls text[] NOT NULL DEFAULT '{}',
  published boolean NOT NULL DEFAULT true,
  is_seed boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.personas TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.personas TO authenticated;
GRANT ALL ON public.personas TO service_role;

ALTER TABLE public.personas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads published personas"
ON public.personas FOR SELECT TO anon, authenticated
USING (published = true);

CREATE POLICY "Admins read every persona"
ON public.personas FOR SELECT TO authenticated
USING (public.is_persona_admin(auth.uid()));

CREATE POLICY "Admins create personas"
ON public.personas FOR INSERT TO authenticated
WITH CHECK (public.is_persona_admin(auth.uid()));

CREATE POLICY "Admins update personas"
ON public.personas FOR UPDATE TO authenticated
USING (public.is_persona_admin(auth.uid()))
WITH CHECK (public.is_persona_admin(auth.uid()));

CREATE POLICY "Admins delete personas"
ON public.personas FOR DELETE TO authenticated
USING (public.is_persona_admin(auth.uid()));

CREATE INDEX personas_region_idx ON public.personas (region, sort_order);

-- Companion media columns ------------------------------------------------------
ALTER TABLE public.companions
  ADD COLUMN IF NOT EXISTS intro_video_url text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS gallery_urls text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS published boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS persona_slug text NOT NULL DEFAULT '';

-- Seed the original personas ---------------------------------------------------
INSERT INTO public.personas (slug, name, age_vibe, region, city, job, persona_gender, personality, tags, backstory, is_seed, sort_order)
VALUES
  ('thao','Thảo','24','bac','Hà Nội','Thiết kế','female','Tinh tế', ARRAY['tinh tế','cà phê','phố cổ'],'Tinh tế, hay cà phê phố cổ',true,1),
  ('hang','Hằng','27','bac','Hà Nội','Ngân hàng','female','Chín chắn', ARRAY['chín chắn','duyên ngầm','điềm tĩnh'],'Chín chắn, duyên ngầm',true,2),
  ('lan','Lan','23','bac','Hải Phòng','Sinh viên','female','Thẳng tính', ARRAY['thẳng tính','dễ thương','tươi vui'],'Thẳng tính, dễ thương',true,3),
  ('tram','Trâm','23','nam','Sài Gòn','Marketing','female','Năng động', ARRAY['năng động','trà sữa','rooftop'],'Năng động, mê trà sữa và rooftop',true,4),
  ('vy','Vy','26','nam','Sài Gòn','Kế toán','female','Hài hước', ARRAY['hài hước','hay trêu','tinh ý'],'Hài hước, hay trêu',true,5),
  ('nhi','Nhi','22','nam','Vũng Tàu','Phục vụ quán cà phê','female','Hiền', ARRAY['hiền','thích biển','ấm áp'],'Hiền, thích biển',true,6),
  ('ngoc','Ngọc','25','trung','Huế','Giáo viên','female','Dịu dàng', ARRAY['dịu dàng','e ấp','sâu sắc'],'Dịu dàng, e ấp',true,7),
  ('my','My','24','trung','Đà Nẵng','Hướng dẫn viên','female','Thẳng thắn', ARRAY['thẳng','vui','hay đi phượt'],'Thẳng, vui, hay đi phượt',true,8),
  ('mai','Mai','22','tay','Cần Thơ','Sinh viên','female','Hiền', ARRAY['hiền','hào sảng','thân thiện'],'Hiền, hào sảng',true,9),
  ('ut','Út','24','tay','Bến Tre','Chủ shop online','female','Vui tính', ARRAY['vui tính','dễ thương','ấm áp'],'Vui tính, nói chuyện dễ thương',true,10);