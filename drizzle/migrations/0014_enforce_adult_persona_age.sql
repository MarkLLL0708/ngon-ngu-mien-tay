CREATE OR REPLACE FUNCTION public.validate_adult_persona_age()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  parsed_age integer;
BEGIN
  IF NEW.published THEN
    IF NEW.age_vibe !~ '^\s*[0-9]{2}\s*$' THEN
      RAISE EXCEPTION 'Published romantic personas require an explicit adult age from 18 to 99';
    END IF;
    parsed_age := trim(NEW.age_vibe)::integer;
    IF parsed_age < 18 OR parsed_age > 99 THEN
      RAISE EXCEPTION 'Published romantic personas require an explicit adult age from 18 to 99';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_adult_persona_age_before_write
BEFORE INSERT OR UPDATE OF age_vibe, published ON public.personas
FOR EACH ROW
EXECUTE FUNCTION public.validate_adult_persona_age();

COMMENT ON FUNCTION public.validate_adult_persona_age() IS 'Prevents published romantic personas from having missing, ambiguous, or under-18 ages.';