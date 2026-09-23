import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * ============================================================
 * ADMIN_USER_IDS — FILL THIS IN
 * ------------------------------------------------------------
 * Paste your own user id (profiles.id) here to unlock
 * /app/admin/personas. Example:
 *   export const ADMIN_USER_IDS = ["2f9c1f7e-....-....-....-............"];
 * Also add the same id to the `persona_admins` table so the
 * database allows writes and media uploads.
 * ============================================================
 */
export const ADMIN_USER_IDS: string[] = [
  // "PASTE-YOUR-USER-ID-HERE",
];

export type AdminState = { loading: boolean; isAdmin: boolean; userId: string | null };

/** True when the signed-in user is in ADMIN_USER_IDS or in the persona_admins table. */
export function useIsPersonaAdmin(): AdminState {
  const [state, setState] = useState<AdminState>({ loading: true, isAdmin: false, userId: null });

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      const userId = data.user?.id ?? null;
      if (!userId) { if (active) setState({ loading: false, isAdmin: false, userId: null }); return; }
      if (ADMIN_USER_IDS.includes(userId)) { if (active) setState({ loading: false, isAdmin: true, userId }); return; }
      const { data: row } = await supabase.from("persona_admins").select("user_id").eq("user_id", userId).maybeSingle();
      if (active) setState({ loading: false, isAdmin: Boolean(row), userId });
    })();
    return () => { active = false; };
  }, []);

  return state;
}
