import { supabase } from "@/integrations/supabase/client";

export type UserGender = "male" | "female" | "nonbinary" | "unspecified";
export type TargetGender = "male" | "female" | "nonbinary" | "unspecified";

/** One atomic choice: who you are AND who you want to talk to, never half-set. */
export type GenderPair = { key: string; user: UserGender; target: TargetGender; vi: string; en: string };

export const GENDER_PAIRS: GenderPair[] = [
  { key: "m-f", user: "male", target: "female", vi: "Nam tìm Nữ", en: "Man seeking Woman" },
  { key: "m-m", user: "male", target: "male", vi: "Nam tìm Nam", en: "Man seeking Man" },
  { key: "f-m", user: "female", target: "male", vi: "Nữ tìm Nam", en: "Woman seeking Man" },
  { key: "f-f", user: "female", target: "female", vi: "Nữ tìm Nữ", en: "Woman seeking Woman" },
  { key: "open", user: "nonbinary", target: "nonbinary", vi: "Khác / Đa dạng", en: "Other / Open" },
  { key: "none", user: "unspecified", target: "unspecified", vi: "Không muốn chọn", en: "Prefer not to say" },
];

export const GENDER_NOTE_VI = "Chỉ dùng để trò chuyện đúng chất và đúng người, không hiển thị công khai và có thể đổi bất cứ lúc nào.";
export const GENDER_NOTE_EN = "Only used to get the conversation right, never shown publicly, and you can change it anytime.";
export const GENDER_PAIR_CHANGED_EVENT = "tangpt-gender-pair-changed";

export function pairOf(user: string | null | undefined, target: string | null | undefined): GenderPair | null {
  return GENDER_PAIRS.find((pair) => pair.user === user && pair.target === target) ?? null;
}

/** Natural Vietnamese pronoun defaults implied by the pair. */
export function defaultAddress(user: UserGender, target: TargetGender): [string, string] {
  if (user === "male" && target === "female") return ["anh", "em"];
  if (user === "female" && target === "male") return ["em", "anh"];
  return ["mình", "bạn"];
}

/** Persona list filter: "unspecified"/"nonbinary" means show everyone. */
export function personaGenderFilter(target: TargetGender): "male" | "female" | null {
  return target === "male" || target === "female" ? target : null;
}

export async function saveGenderPair(userId: string, pair: GenderPair) {
  const { error } = await supabase.from("profiles")
    .update({ user_gender: pair.user, default_target_gender: pair.target, gender: pair.user })
    .eq("id", userId);
  if (error) throw error;
  window.dispatchEvent(new CustomEvent<GenderPair>(GENDER_PAIR_CHANGED_EVENT, { detail: pair }));
}
