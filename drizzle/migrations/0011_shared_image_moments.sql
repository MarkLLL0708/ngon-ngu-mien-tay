CREATE TABLE public.shared_image_moments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL DEFAULT 'food',
  image_url text NOT NULL DEFAULT '',
  caption_hint text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.shared_image_moments TO authenticated;
GRANT ALL ON public.shared_image_moments TO service_role;

ALTER TABLE public.shared_image_moments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signed-in users read shared image moments" ON public.shared_image_moments
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins create shared image moments" ON public.shared_image_moments
  FOR INSERT TO authenticated WITH CHECK (public.is_persona_admin(auth.uid()));
CREATE POLICY "Admins update shared image moments" ON public.shared_image_moments
  FOR UPDATE TO authenticated USING (public.is_persona_admin(auth.uid())) WITH CHECK (public.is_persona_admin(auth.uid()));
CREATE POLICY "Admins delete shared image moments" ON public.shared_image_moments
  FOR DELETE TO authenticated USING (public.is_persona_admin(auth.uid()));

CREATE TABLE public.companion_image_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  companion_id uuid REFERENCES public.companions(id) ON DELETE CASCADE,
  image_source text NOT NULL DEFAULT 'shared',
  image_id uuid,
  shown_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX companion_image_history_recent_idx ON public.companion_image_history (companion_id, shown_at DESC);

GRANT SELECT, INSERT, DELETE ON public.companion_image_history TO authenticated;
GRANT ALL ON public.companion_image_history TO service_role;

ALTER TABLE public.companion_image_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners read their companion image history" ON public.companion_image_history
  FOR SELECT TO authenticated USING (EXISTS (
    SELECT 1 FROM public.companions c WHERE c.id = companion_image_history.companion_id AND c.user_id = auth.uid()));
CREATE POLICY "Owners log their companion image history" ON public.companion_image_history
  FOR INSERT TO authenticated WITH CHECK (EXISTS (
    SELECT 1 FROM public.companions c WHERE c.id = companion_image_history.companion_id AND c.user_id = auth.uid()));
CREATE POLICY "Admins read all companion image history" ON public.companion_image_history
  FOR SELECT TO authenticated USING (public.is_persona_admin(auth.uid()));