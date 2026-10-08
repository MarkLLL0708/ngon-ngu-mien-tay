CREATE TABLE public.companion_journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  companion_id uuid NOT NULL REFERENCES public.companions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  entry_date date NOT NULL DEFAULT current_date,
  content text NOT NULL,
  mood_tag text NOT NULL DEFAULT 'bình yên',
  image_source text CHECK (image_source IN ('shared','persona')),
  image_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (companion_id, entry_date)
);
CREATE INDEX companion_journal_entries_companion_idx ON public.companion_journal_entries (companion_id, entry_date DESC);
GRANT SELECT ON public.companion_journal_entries TO authenticated;
GRANT ALL ON public.companion_journal_entries TO service_role;
ALTER TABLE public.companion_journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own companion journal" ON public.companion_journal_entries
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.companions c WHERE c.id = companion_id AND c.user_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.delete_user_account_data(_user_id uuid)
 RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  DELETE FROM public.companion_journal_entries WHERE user_id = _user_id;
  DELETE FROM public.companion_messages WHERE user_id = _user_id;
  DELETE FROM public.companion_memories WHERE user_id = _user_id;
  DELETE FROM public.voice_ratings WHERE user_id = _user_id;
  DELETE FROM public.reply_generations WHERE user_id = _user_id;
  DELETE FROM public.companions WHERE user_id = _user_id;
  DELETE FROM public.persona_admins WHERE user_id = _user_id;
  DELETE FROM public.profiles WHERE id = _user_id;
END;
$function$;