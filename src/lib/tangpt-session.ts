import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SessionState = { loading: boolean; userId: string | null };

export function useSessionUser(): SessionState {
  const [state, setState] = useState<SessionState>({ loading: true, userId: null });
  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => { if (active) setState({ loading: false, userId: data.user?.id ?? null }); });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setState({ loading: false, userId: session?.user?.id ?? null });
    });
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, []);
  return state;
}

export async function needsOnboarding(userId: string) {
  const { data } = await supabase.from("profiles").select("age_confirmed").eq("id", userId).maybeSingle();
  return !data?.age_confirmed;
}
