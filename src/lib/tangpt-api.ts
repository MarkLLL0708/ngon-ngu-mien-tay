import { supabase } from "@/integrations/supabase/client";

export type ReplyLanguage = "vi" | "en" | "both";
export type OutcomeCode = "ok" | "limit_reached" | "age_not_confirmed" | "unavailable";
export type Outcome<T> = { data: T | null; code: OutcomeCode };

function classify(raw: string): OutcomeCode {
  if (raw.includes("limit_reached")) return "limit_reached";
  if (raw.includes("age_not_confirmed")) return "age_not_confirmed";
  return "unavailable";
}

async function errorCode(error: unknown): Promise<OutcomeCode> {
  const ctx = (error as { context?: { json?: () => Promise<unknown> } } | null)?.context;
  if (ctx && typeof ctx.json === "function") {
    try {
      const body = (await ctx.json()) as Record<string, unknown> | null;
      const value = body?.["error"] ?? body?.["code"] ?? body?.["message"];
      if (typeof value === "string") return classify(value);
    } catch { /* body is not JSON */ }
  }
  const message = (error as { message?: string } | null)?.message ?? "";
  return classify(message);
}

export async function callFunction<T>(name: string, body: Record<string, unknown>): Promise<Outcome<T>> {
  try {
    const { data, error } = await supabase.functions.invoke<T>(name, { body });
    if (error) return { data: null, code: await errorCode(error) };
    const payload = data as (T & { error?: string }) | null;
    if (payload && typeof payload.error === "string") return { data: null, code: classify(payload.error) };
    return { data: (data as T) ?? null, code: "ok" };
  } catch (error) {
    return { data: null, code: await errorCode(error) };
  }
}

export function sampleCompanionReply(name: string, language: ReplyLanguage): string {
  if (language === "en") return `Hey, it's ${name}.\nI just got home. How was your day?`;
  if (language === "both") return `Hi, ${name} nè.\nMới về tới nhà nè. Hôm nay của anh sao rồi?\n(How was your day?)`;
  return `Ủa, nhắn nè.\nMới về tới nhà à. Hôm nay của anh sao rồi?`;
}
