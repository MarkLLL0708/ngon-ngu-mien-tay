-- Companion texting habits, signature emoji and relationship progress
ALTER TABLE public.companions
  ADD COLUMN IF NOT EXISTS emoji_signature text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS texting_habits jsonb NOT NULL DEFAULT '{"sends_multiple": true, "uses_lowercase": false, "self_corrects": false, "typical_msg_length": "varies"}'::jsonb,
  ADD COLUMN IF NOT EXISTS relationship_stage integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS relationship_score integer NOT NULL DEFAULT 0;

ALTER TABLE public.companion_memories
  ADD COLUMN IF NOT EXISTS importance_score integer NOT NULL DEFAULT 3;

-- Per-companion emotional state ------------------------------------------------
CREATE TABLE IF NOT EXISTS public.companion_emotional_state (
  companion_id uuid PRIMARY KEY REFERENCES public.companions(id) ON DELETE CASCADE,
  mood text NOT NULL DEFAULT 'neutral',
  energy integer NOT NULL DEFAULT 70,
  affection integer NOT NULL DEFAULT 40,
  last_updated timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.companion_emotional_state TO authenticated;
GRANT ALL ON public.companion_emotional_state TO service_role;

ALTER TABLE public.companion_emotional_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners read their companion state"
ON public.companion_emotional_state FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.companions c WHERE c.id = companion_id AND c.user_id = auth.uid()));

CREATE POLICY "Owners create their companion state"
ON public.companion_emotional_state FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.companions c WHERE c.id = companion_id AND c.user_id = auth.uid()));

CREATE POLICY "Owners update their companion state"
ON public.companion_emotional_state FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.companions c WHERE c.id = companion_id AND c.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.companions c WHERE c.id = companion_id AND c.user_id = auth.uid()));

CREATE POLICY "Owners delete their companion state"
ON public.companion_emotional_state FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.companions c WHERE c.id = companion_id AND c.user_id = auth.uid()));

-- Persona image moments ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.persona_image_moments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  companion_id uuid REFERENCES public.companions(id) ON DELETE CASCADE,
  persona_id uuid REFERENCES public.personas(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'daily',
  image_url text NOT NULL DEFAULT '',
  caption_hint text NOT NULL DEFAULT '',
  times_shown integer NOT NULL DEFAULT 0,
  last_shown_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS persona_image_moments_persona_idx
  ON public.persona_image_moments (persona_id, category, last_shown_at NULLS FIRST);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.persona_image_moments TO authenticated;
GRANT ALL ON public.persona_image_moments TO service_role;

ALTER TABLE public.persona_image_moments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signed-in users read image moments"
ON public.persona_image_moments FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admins create image moments"
ON public.persona_image_moments FOR INSERT TO authenticated
WITH CHECK (public.is_persona_admin(auth.uid()));

CREATE POLICY "Admins update image moments"
ON public.persona_image_moments FOR UPDATE TO authenticated
USING (public.is_persona_admin(auth.uid()))
WITH CHECK (public.is_persona_admin(auth.uid()));

CREATE POLICY "Admins delete image moments"
ON public.persona_image_moments FOR DELETE TO authenticated
USING (public.is_persona_admin(auth.uid()));

-- Lets the app mark a moment as shown without admin rights, via a definer fn.
CREATE OR REPLACE FUNCTION public.mark_image_moment_shown(_moment_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.persona_image_moments
     SET times_shown = times_shown + 1, last_shown_at = now()
   WHERE id = _moment_id;
$$;

GRANT EXECUTE ON FUNCTION public.mark_image_moment_shown(uuid) TO authenticated, service_role;

-- Quiet daily drift of emotional state back towards baseline.
CREATE OR REPLACE FUNCTION public.decay_companion_emotional_state()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  touched integer;
BEGIN
  UPDATE public.companion_emotional_state
     SET energy = energy + LEAST(2, GREATEST(-2, 70 - energy)),
         affection = affection + LEAST(2, GREATEST(-2, 40 - affection)),
         last_updated = now()
   WHERE last_updated < now() - interval '20 hours';
  GET DIAGNOSTICS touched = ROW_COUNT;
  RETURN touched;
END;
$$;

GRANT EXECUTE ON FUNCTION public.decay_companion_emotional_state() TO service_role;