CREATE TABLE public.voice_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL DEFAULT 'PLACEHOLDER',
  provider text NOT NULL,
  voice_id text NOT NULL DEFAULT 'REPLACE_WITH_VOICE_ID',
  persona_gender text NOT NULL DEFAULT 'female',
  region text NOT NULL DEFAULT 'south',
  age_vibe text NOT NULL DEFAULT 'genz',
  style_prompt text NOT NULL DEFAULT '',
  speed numeric NOT NULL DEFAULT 1.0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT voice_profiles_provider_check CHECK (provider IN ('vbee','cartesia','gemini','elevenlabs')),
  CONSTRAINT voice_profiles_gender_check CHECK (persona_gender IN ('female','male','nonbinary')),
  CONSTRAINT voice_profiles_region_check CHECK (region IN ('north','south','central','mekong')),
  CONSTRAINT voice_profiles_age_check CHECK (age_vibe IN ('genz','27_35'))
);

GRANT SELECT ON public.voice_profiles TO authenticated;
GRANT ALL ON public.voice_profiles TO service_role;
ALTER TABLE public.voice_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Logged-in users can read voice profiles"
ON public.voice_profiles FOR SELECT TO authenticated USING (true);

CREATE TABLE public.voice_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES public.voice_profiles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "natural" smallint NOT NULL CHECK ("natural" BETWEEN 1 AND 5),
  accent smallint NOT NULL CHECK (accent BETWEEN 1 AND 5),
  keep_listening smallint NOT NULL CHECK (keep_listening BETWEEN 1 AND 5),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.voice_ratings TO authenticated;
GRANT ALL ON public.voice_ratings TO service_role;
ALTER TABLE public.voice_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own voice ratings"
ON public.voice_ratings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users read own voice ratings"
ON public.voice_ratings FOR SELECT TO authenticated USING (auth.uid() = user_id);

ALTER TABLE public.companions ADD COLUMN IF NOT EXISTS voice_profile_id uuid REFERENCES public.voice_profiles(id) ON DELETE SET NULL;

INSERT INTO public.voice_profiles (label, provider, voice_id, persona_gender, region, age_vibe)
SELECT 'PLACEHOLDER', p, 'REPLACE_WITH_VOICE_ID', 'female', r, 'genz'
FROM unnest(ARRAY['vbee','cartesia','gemini','elevenlabs']) AS p,
     unnest(ARRAY['north','south','central','mekong']) AS r;