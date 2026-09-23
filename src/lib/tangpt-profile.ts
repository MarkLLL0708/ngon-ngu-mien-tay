import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { AgeGroup, RegionKey } from "@/lib/tangpt-data";
import type { ReplyLanguage } from "@/lib/tangpt-api";
import { GENDER_PAIR_CHANGED_EVENT, type GenderPair, type TargetGender, type UserGender } from "@/lib/tangpt-gender";

export type { UserGender, TargetGender };
export type Profile = {
  userId: string | null; region: RegionKey | null; city: string | null; ageGroup: AgeGroup | null; plan: string;
  gender: UserGender; targetGender: TargetGender;
};

const regionKeys: RegionKey[] = ["bac", "nam", "trung", "tay"];
const ageGroups: AgeGroup[] = ["18-26", "27-35", "36+"];
const genders: UserGender[] = ["male", "female", "nonbinary", "unspecified"];

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  useEffect(() => {
    let active = true;
    const applyGenderPair = (event: Event) => {
      const pair = (event as CustomEvent<GenderPair>).detail;
      if (!pair) return;
      setProfile((current) => current ? { ...current, gender: pair.user, targetGender: pair.target } : current);
    };
    window.addEventListener(GENDER_PAIR_CHANGED_EVENT, applyGenderPair);
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id ?? null;
      if (!userId) {
        if (active) setProfile({ userId: null, region: null, city: null, ageGroup: null, plan: "free", gender: "unspecified", targetGender: "unspecified" });
        return;
      }
      const { data } = await supabase.from("profiles")
        .select("default_region, default_city, age_group, subscription_status, gender, user_gender, default_target_gender")
        .eq("id", userId).maybeSingle();
      if (!active) return;
      const region = regionKeys.find((key) => key === data?.default_region) ?? null;
      const ageGroup = ageGroups.find((value) => value === data?.age_group) ?? null;
      const gender = genders.find((value) => value === (data?.user_gender ?? data?.gender)) ?? "unspecified";
      const targetGender = genders.find((value) => value === data?.default_target_gender) ?? "unspecified";
      setProfile({ userId, region, city: data?.default_city ?? null, ageGroup, plan: data?.subscription_status ?? "free", gender, targetGender });
    })();
    return () => {
      active = false;
      window.removeEventListener(GENDER_PAIR_CHANGED_EVENT, applyGenderPair);
    };
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
