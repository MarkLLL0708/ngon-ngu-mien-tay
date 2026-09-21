import { supabase } from "@/integrations/supabase/client";
import { TEST_GUEST_MODE } from "./tangpt-config";

/** Ensure a profiles row exists for the given user (anonymous guests included). */
export async function ensureProfileRow(userId: string) {
  const { data } = await supabase.from("profiles").select("id, age_confirmed").eq("id", userId).maybeSingle();
  if (!data) {
    await supabase.from("profiles").insert({ id: userId, age_confirmed: TEST_GUEST_MODE });
    return;
  }
  // Guests created before onboarding would otherwise hit age_not_confirmed.
  if (TEST_GUEST_MODE && !data.age_confirmed) await supabase.from("profiles").update({ age_confirmed: true }).eq("id", userId);
}

/**
 * Returns the current user id, creating an anonymous guest session when
 * TEST_GUEST_MODE is on and nobody is signed in. Returns null when signed out
 * and guest mode is off.
 */
export async function ensureGuestSession(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  let userId = data.user?.id ?? null;
  if (!userId && TEST_GUEST_MODE) {
    const { data: anon, error } = await supabase.auth.signInAnonymously();
    if (error) return null;
    userId = anon.user?.id ?? null;
  }
  if (userId) await ensureProfileRow(userId);
  return userId;
}

export async function resetGuestSession(): Promise<string | null> {
  window.localStorage.removeItem("tangpt-onboarded");
  window.localStorage.removeItem("tangpt-age");
  window.localStorage.removeItem("tangpt-history");
  window.localStorage.removeItem("tangpt-address-self");
  window.localStorage.removeItem("tangpt-address-other");
  await supabase.auth.signOut();
  return ensureGuestSession();
}
