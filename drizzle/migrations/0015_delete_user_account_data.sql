CREATE OR REPLACE FUNCTION public.delete_user_account_data(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.companion_messages WHERE user_id = _user_id;
  DELETE FROM public.companion_memories WHERE user_id = _user_id;
  DELETE FROM public.voice_ratings WHERE user_id = _user_id;
  DELETE FROM public.reply_generations WHERE user_id = _user_id;
  DELETE FROM public.companions WHERE user_id = _user_id;
  DELETE FROM public.persona_admins WHERE user_id = _user_id;
  DELETE FROM public.profiles WHERE id = _user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_user_account_data(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_user_account_data(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.delete_user_account_data(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user_account_data(uuid) TO service_role;