CREATE POLICY "Signed-in users read persona media"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'persona-media');

CREATE POLICY "Persona admins upload persona media"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'persona-media' AND public.is_persona_admin(auth.uid()));

CREATE POLICY "Persona admins update persona media"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'persona-media' AND public.is_persona_admin(auth.uid()))
WITH CHECK (bucket_id = 'persona-media' AND public.is_persona_admin(auth.uid()));

CREATE POLICY "Persona admins delete persona media"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'persona-media' AND public.is_persona_admin(auth.uid()));