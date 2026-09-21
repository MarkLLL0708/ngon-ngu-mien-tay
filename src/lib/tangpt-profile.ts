import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { AgeGroup, RegionKey } from "@/lib/tangpt-data";
import type { ReplyLanguage } from "@/lib/tangpt-api";

export type Profile = { userId: string | null; region: RegionKey | null; city: string | null; ageGroup: AgeGroup | null; plan: string };

const regionKeys: RegionKey[] = ["bac", "nam", "trung", "tay"];
const ageGroups: AgeGroup[] = ["18-26", "27-35", "36+"];

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  useEffect(() => {
    let active = true;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id ?? null;
      if (!userId) { if (active) setProfile({ userId: null, region: null, city: null, ageGroup: null, plan: "free" }); return; }
      const { data } = await supabase.from("profiles").select("default_region, default_city, age_group, subscription_status").eq("id", userId).maybeSingle();
      if (!active) return;
      const region = regionKeys.find((key) => key === data?.default_region) ?? null;
      const ageGroup = ageGroups.find((value) => value === data?.age_group) ?? null;
      setProfile({ userId, region, city: data?.default_city ?? null, ageGroup, plan: data?.subscription_status ?? "free" });
    })();
    return () => { active = false; };
  }, []);
  return profile;
}

export function readReplyLanguage(): ReplyLanguage {
  if (typeof window === "undefined") return "vi";
  const saved = window.localStorage.getItem("tangpt-reply-language");
  return saved === "en" || saved === "both" ? saved : "vi";
}

export function saveReplyLanguage(value: ReplyLanguage) {
  window.localStorage.setItem("tangpt-reply-language", value);
}
