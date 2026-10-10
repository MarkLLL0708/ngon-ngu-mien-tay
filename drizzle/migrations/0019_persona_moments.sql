CREATE TABLE public.persona_moments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id uuid NOT NULL REFERENCES public.personas(id) ON DELETE CASCADE,
  caption text NOT NULL DEFAULT '',
  image_source text NOT NULL CHECK (image_source IN ('shared','persona')),
  image_id uuid NOT NULL,
  posted_at timestamptz NOT NULL DEFAULT now(),
  published boolean NOT NULL DEFAULT true
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.persona_moments TO authenticated;
GRANT ALL ON public.persona_moments TO service_role;
ALTER TABLE public.persona_moments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in users read published moments" ON public.persona_moments
  FOR SELECT TO authenticated USING (published OR public.is_persona_admin(auth.uid()));
CREATE POLICY "Admins create moments" ON public.persona_moments
  FOR INSERT TO authenticated WITH CHECK (public.is_persona_admin(auth.uid()));
CREATE POLICY "Admins update moments" ON public.persona_moments
  FOR UPDATE TO authenticated USING (public.is_persona_admin(auth.uid())) WITH CHECK (public.is_persona_admin(auth.uid()));
CREATE POLICY "Admins delete moments" ON public.persona_moments
  FOR DELETE TO authenticated USING (public.is_persona_admin(auth.uid()));
CREATE INDEX persona_moments_persona_idx ON public.persona_moments (persona_id, posted_at DESC);