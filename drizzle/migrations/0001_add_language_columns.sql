ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ui_language text NOT NULL DEFAULT 'vi',
  ADD COLUMN IF NOT EXISTS reply_language text NOT NULL DEFAULT 'vi';

ALTER TABLE public.companions
  ADD COLUMN IF NOT EXISTS city text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS chat_language text NOT NULL DEFAULT 'vi';