import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type CompanionRow = {
  id: string;
  name: string;
  personality: string;
  mode: string;
  region: string;
  persona_gender: string;
  persona_slug: string;
  created_at: string;
  last_message_at: string | null;
  last_message_preview: string;
};

export const COMPANION_SELECT =
  "id, name, personality, mode, region, persona_gender, persona_slug, created_at, last_message_at, last_message_preview";

export function sortCompanions(rows: CompanionRow[]) {
  return rows.slice().sort((a, b) => {
    const at = new Date(a.last_message_at ?? a.created_at).getTime();
    const bt = new Date(b.last_message_at ?? b.created_at).getTime();
    return bt - at;
  });
}

/** "5 phút trước" / "5 minutes ago" */
export function relativeTime(value: string | null, vi: boolean): string {
  if (!value) return vi ? "Chưa nhắn" : "No messages";
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return vi ? "Vừa xong" : "Just now";
  if (minutes < 60) return vi ? `${minutes} phút trước` : `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24 && new Date().getDate() === date.getDate()) return vi ? `${hours} giờ trước` : `${hours} h ago`;
  const days = Math.floor(diff / 86400000);
  if (days <= 1) return vi ? "Hôm qua" : "Yesterday";
  if (days < 7) return vi ? `${days} ngày trước` : `${days} days ago`;
  return date.toLocaleDateString(vi ? "vi-VN" : "en-GB");
}

export function dayLabel(value: string, vi: boolean): string {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date(today.getTime() - 86400000);
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (same(date, today)) return vi ? "Hôm nay" : "Today";
  if (same(date, yesterday)) return vi ? "Hôm qua" : "Yesterday";
  return date.toLocaleDateString(vi ? "vi-VN" : "en-GB");
}

/** Adaptive labels based on the persona genders the user actually created. */
export function companionGenderMix(genders: string[]): "female" | "male" | "mixed" {
  const unique = Array.from(new Set(genders));
  if (unique.length === 0) return "female";
  if (unique.length === 1 && unique[0] === "female") return "female";
  if (unique.length === 1 && unique[0] === "male") return "male";
  return "mixed";
}

export function navLabel(mix: "female" | "male" | "mixed", vi: boolean) {
  if (!vi) return "AI companion";
  if (mix === "male") return "Bạn trai AI";
  if (mix === "female") return "Bạn gái AI";
  return "Bạn AI";
}

export function listTitle(mix: "female" | "male" | "mixed", vi: boolean) {
  if (!vi) return "Your companions";
  if (mix === "male") return "Anh ấy của bạn";
  if (mix === "female") return "Cô ấy của bạn";
  return "Bạn AI của bạn";
}

export function personaPronoun(gender: string | undefined, vi: boolean) {
  if (!vi) return "they";
  if (gender === "male") return "Anh ấy";
  if (gender === "nonbinary") return "Người ấy";
  return "Cô ấy";
}

export function useCompanions() {
  const [rows, setRows] = useState<CompanionRow[] | null>(null);
  useEffect(() => {
    let active = true;
    supabase.from("companions").select(COMPANION_SELECT).then(({ data }) => {
      if (active) setRows(sortCompanions((data ?? []) as CompanionRow[]));
    });
    return () => { active = false; };
  }, []);
  return { rows, setRows };
}
