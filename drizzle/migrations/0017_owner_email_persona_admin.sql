CREATE OR REPLACE FUNCTION public.is_persona_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.persona_admins WHERE user_id = _user_id)
      OR EXISTS (
        SELECT 1 FROM auth.users u
        WHERE u.id = _user_id
          AND lower(u.email) = 'marklyy0708@gmail.com'
          AND u.email_confirmed_at IS NOT NULL
      )
$$;
GRANT EXECUTE ON FUNCTION public.is_persona_admin(uuid) TO authenticated;