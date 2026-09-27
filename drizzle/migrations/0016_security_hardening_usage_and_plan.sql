-- 1) Users cannot grant themselves a paid plan
CREATE OR REPLACE FUNCTION public.protect_subscription_status()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF current_user IN ('authenticated','anon') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.subscription_status := 'free';
    ELSIF NEW.subscription_status IS DISTINCT FROM OLD.subscription_status THEN
      NEW.subscription_status := OLD.subscription_status;
    END IF;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS protect_subscription_status_trg ON public.profiles;
CREATE TRIGGER protect_subscription_status_trg BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_subscription_status();

-- 2) Tamper-proof usage log (users can read, never edit or delete)
CREATE TABLE public.usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('companion','rizz')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.usage_events TO authenticated;
GRANT ALL ON public.usage_events TO service_role;
ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own usage" ON public.usage_events FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE INDEX usage_events_user_kind_time ON public.usage_events (user_id, kind, created_at DESC);

CREATE OR REPLACE FUNCTION public.record_usage(_kind text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'unauthorized'; END IF;
  INSERT INTO public.usage_events (user_id, kind) VALUES (auth.uid(), _kind);
END; $$;
REVOKE ALL ON FUNCTION public.record_usage(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_usage(text) TO authenticated;