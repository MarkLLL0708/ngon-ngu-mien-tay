ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_gender text NOT NULL DEFAULT 'unspecified';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS default_target_gender text NOT NULL DEFAULT 'unspecified';
UPDATE public.profiles SET user_gender = gender WHERE gender IS NOT NULL AND gender <> '';
COMMENT ON COLUMN public.profiles.gender IS 'DEPRECATED: replaced by user_gender (set together with default_target_gender)';

ALTER TABLE public.companions ADD COLUMN IF NOT EXISTS user_gender text NOT NULL DEFAULT '';
ALTER TABLE public.companions ADD COLUMN IF NOT EXISTS target_gender text NOT NULL DEFAULT '';