import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RegionKey } from "./tangpt-data";

export const PERSONA_BUCKET = "persona-media";

export type PersonaRow = {
  id: string;
  slug: string;
  name: string;
  age_vibe: string;
  region: string;
  city: string;
  job: string;
  persona_gender: string;
  personality: string;
  tags: string[];
  backstory: string;
  family: string;
  daily_life: string;
  quirks: string;
  favorite_things: string;
  opinions: string;
  catchphrase: string;
  intro_video_url: string;
  gallery_urls: string[];
  published: boolean;
  is_seed: boolean;
  sort_order: number;
};

export const PERSONA_SELECT =
  "id, slug, name, age_vibe, region, city, job, persona_gender, personality, tags, backstory, family, daily_life, quirks, favorite_things, opinions, catchphrase, intro_video_url, gallery_urls, published, is_seed, sort_order";

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 60 * 1024 * 1024;
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const VIDEO_TYPES = ["video/mp4", "video/webm"];

/** Published personas only — what normal users ever see. */
export function usePublishedPersonas(region?: RegionKey, personaGender?: "male" | "female" | null) {
  const [rows, setRows] = useState<PersonaRow[] | null>(null);
  useEffect(() => {
    let active = true;
    (async () => {
      let query = supabase.from("personas").select(PERSONA_SELECT).eq("published", true).order("sort_order");
      if (region) query = query.eq("region", region);
      if (personaGender) query = query.eq("persona_gender", personaGender);
      const { data } = await query;
      if (active) setRows((data as PersonaRow[]) ?? []);
    })();
    return () => { active = false; };
  }, [region, personaGender]);
  return rows;
}

export function usePersona(id: string) {
  const [row, setRow] = useState<PersonaRow | null | undefined>(undefined);
  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.from("personas").select(PERSONA_SELECT).eq("id", id).maybeSingle();
      if (active) setRow((data as PersonaRow) ?? null);
    })();
    return () => { active = false; };
  }, [id]);
  return row;
}

export async function listAllPersonas(): Promise<PersonaRow[]> {
  const { data } = await supabase.from("personas").select(PERSONA_SELECT).order("sort_order");
  return (data as PersonaRow[]) ?? [];
}

/* ---------------------------------- media --------------------------------- */

const signedCache = new Map<string, { promise: Promise<string>; expires: number }>();

/** Resolve a stored object path into a temporary readable URL (cached per path). */
export function mediaUrl(path: string): Promise<string> {
  if (!path) return Promise.resolve("");
  if (path.startsWith("http")) return Promise.resolve(path);
  const cached = signedCache.get(path);
  if (cached && cached.expires > Date.now()) return cached.promise;
  const promise = supabase.storage.from(PERSONA_BUCKET).createSignedUrl(path, 3600)
    .then(({ data }) => data?.signedUrl ?? "")
    .catch(() => "");
  signedCache.set(path, { promise, expires: Date.now() + 50 * 60 * 1000 });
  return promise;
}

/** Resolve a list of paths into display URLs, keeping order. */
export function useMediaUrls(paths: string[]): string[] {
  const key = paths.join("|");
  const [urls, setUrls] = useState<string[]>([]);
  useEffect(() => {
    let active = true;
    (async () => {
      const list = key ? key.split("|") : [];
      const resolved = await Promise.all(list.map((path) => mediaUrl(path)));
      if (active) setUrls(resolved.filter(Boolean));
    })();
    return () => { active = false; };
  }, [key]);
  return urls;
}

export function useMediaUrl(path: string): string {
  const urls = useMediaUrls(path ? [path] : []);
  return urls[0] ?? "";
}

function extensionOf(file: File) {
  const fromName = file.name.split(".").pop();
  if (fromName && fromName.length <= 5) return fromName.toLowerCase();
  return file.type.split("/")[1] ?? "bin";
}

/** Upload with per-file progress via a direct storage PUT. Returns the object path. */
export async function uploadPersonaMedia(
  personaId: string,
  file: File,
  onProgress?: (percent: number) => void,
): Promise<string> {
  const { data: session } = await supabase.auth.getSession();
  const token = session.session?.access_token;
  if (!token) throw new Error("no_session");
  const path = `${personaId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extensionOf(file)}`;
  const base = import.meta.env['VITE_SUPABASE_URL'];
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${base}/storage/v1/object/${PERSONA_BUCKET}/${path}`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("x-upsert", "true");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(xhr.responseText || "upload_failed")));
    xhr.onerror = () => reject(new Error("upload_failed"));
    xhr.send(file);
  });
  onProgress?.(100);
  return path;
}

export async function deletePersonaMedia(path: string) {
  if (!path || path.startsWith("http")) return;
  await supabase.storage.from(PERSONA_BUCKET).remove([path]);
  signedCache.delete(path);
}

/** Short bio blurb assembled from the character fields. */
export function personaBlurb(persona: PersonaRow): string {
  return [persona.backstory, persona.quirks].map((part) => part.trim()).filter(Boolean).join(" ");
}

/* ------------------------------ start chatting ----------------------------- */

export type StartOptions = {
  personality?: string;
  personaStyle?: string;
  mode?: string;
  chatLanguage?: string;
  addressSelf?: string;
  addressOther?: string;
  userGender?: string;
  targetGender?: string;
};

/** Create (or reuse) a companion built from a persona and return its id. */
export async function startCompanion(userId: string, persona: PersonaRow, options: StartOptions = {}) {
  const existing = await supabase
    .from("companions").select("id").eq("user_id", userId).eq("persona_slug", persona.slug).limit(1).maybeSingle();
  if (existing.data?.id) return existing.data.id as string;

  const { data, error } = await supabase.from("companions").insert({
    user_id: userId,
    name: persona.name,
    region: persona.region,
    age_vibe: persona.age_vibe,
    personality: options.personality || persona.personality || "Dịu dàng",
    mode: options.mode || "Trò chuyện",
    city: persona.city,
    job: persona.job,
    chat_language: options.chatLanguage || "vi",
    persona_gender: persona.persona_gender,
    persona_style: options.personaStyle || "Nhẹ nhàng",
    address_self: options.addressSelf || "mình",
    address_other: options.addressOther || "bạn",
    user_gender: options.userGender || "",
    target_gender: options.targetGender || "",
    persona_slug: persona.slug,
    intro_video_url: persona.intro_video_url,
    gallery_urls: persona.gallery_urls,
  }).select("id").single();
  if (error || !data) throw error ?? new Error("create_failed");
  return data.id as string;
}
