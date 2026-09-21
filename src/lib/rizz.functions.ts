import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { SYSTEM_PROMPT } from "./rizz.prompt";

export type RizzMode = "reply" | "opener";
export type RizzRegion = "north" | "south" | "central" | "mekong";
export type RizzAgeGroup = "18-26" | "27-35" | "36+";
export type RizzInput = {
  mode: RizzMode;
  region: RizzRegion;
  city: string;
  age_group: RizzAgeGroup;
  input_text: string;
  ui_language: "vi" | "en";
  reply_language: "vi" | "en" | "mix";
};
export type RizzOption = { style: string; text: string; why: string };
export type RizzPayload = { options: RizzOption[]; tip: string };

const FREE_DAILY_LIMIT = 5;
const ROBOTIC = ["tất nhiên", "tôi hiểu", "dưới đây là", "là một ai", "as an ai", "certainly", "i understand", "here are"];
const RETRY_LINE = "Viết lại tự nhiên hơn, như người thật nhắn tin, không giọng trợ lý.";

export class RizzError extends Error {
  constructor(public code: "limit_reached" | "bad_ai_response" | "missing_key" | "ai_unavailable") { super(code); }
}

function buildUserMessage(input: RizzInput) {
  return [
    `Chế độ: ${input.mode}`,
    `Vùng miền: ${input.region}`,
    `Thành phố: ${input.city}`,
    `Độ tuổi của cô ấy: ${input.age_group}`,
    `Ngôn ngữ tin nhắn gửi cho cô ấy: ${input.reply_language}`,
    `Ngôn ngữ giao diện (cho why và tip): ${input.ui_language}`,
    `Nội dung cô ấy nhắn hoặc mô tả profile:\n${input.input_text}`,
  ].join("\n");
}

function clean(text: string) {
  return text
    .trim()
    .replace(/[*#_`]/g, "")
    .replace(/ {2,}/g, " ")
    .replace(/\.\s*$/, "")
    .trim();
}

function parsePayload(raw: string): RizzPayload | null {
  const stripped = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = stripped.indexOf("{");
  const end = stripped.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    const parsed = JSON.parse(stripped.slice(start, end + 1)) as RizzPayload;
    if (!Array.isArray(parsed.options) || parsed.options.length === 0) return null;
    return {
      options: parsed.options.map((option) => ({ style: clean(String(option.style ?? "")), text: clean(String(option.text ?? "")), why: clean(String(option.why ?? "")) })),
      tip: clean(String(parsed.tip ?? "")),
    };
  } catch {
    return null;
  }
}

function isRobotic(payload: RizzPayload) {
  return payload.options.some((option) => ROBOTIC.some((phrase) => option.text.toLowerCase().includes(phrase)));
}

async function askClaude(apiKey: string, userMessage: string): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-5",
      max_tokens: 900,
      temperature: 1,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    }),
  });
  if (!response.ok) {
    console.error("anthropic error", response.status, await response.text());
    throw new RizzError("ai_unavailable");
  }
  const body = (await response.json()) as { content?: { type: string; text?: string }[] };
  return (body.content ?? []).filter((part) => part.type === "text").map((part) => part.text ?? "").join("\n");
}

export const generateRizz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: RizzInput) => data)
  .handler(async ({ data, context }): Promise<RizzPayload> => {
    const apiKey = process.env["ANTHROPIC_API_KEY"];
    if (!apiKey) throw new RizzError("missing_key");
    const { supabase, userId } = context;

    const { data: profile } = await supabase.from("profiles").select("subscription_status").eq("id", userId).maybeSingle();
    if ((profile?.subscription_status ?? "free") !== "pro") {
      const since = new Date();
      since.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from("reply_generations")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", since.toISOString());
      if ((count ?? 0) >= FREE_DAILY_LIMIT) throw new RizzError("limit_reached");
    }

    const baseMessage = buildUserMessage(data);
    let payload = parsePayload(await askClaude(apiKey, baseMessage));
    if (!payload) payload = parsePayload(await askClaude(apiKey, baseMessage));
    if (!payload) throw new RizzError("bad_ai_response");
    if (isRobotic(payload)) {
      const retry = parsePayload(await askClaude(apiKey, `${baseMessage}\n${RETRY_LINE}`));
      if (retry) payload = retry;
    }

    await supabase.from("reply_generations").insert({
      user_id: userId,
      mode: data.mode,
      region: data.region,
      city: data.city,
      age_group: data.age_group,
      input_text: data.input_text,
      result: payload,
    });

    return payload;
  });
