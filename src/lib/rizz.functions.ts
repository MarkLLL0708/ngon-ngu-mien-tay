import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { SYSTEM_PROMPT } from "./rizz.prompt";

export type RizzMode = "reply" | "opener";
export type RizzRegion = "north" | "south" | "central" | "mekong";
export type RizzAgeGroup = "18-26" | "27-35" | "36+";
export type RizzUserGender = "male" | "female" | "nonbinary" | "unspecified";
export type RizzTargetGender = "female" | "male" | "nonbinary";
export type RizzRelativeAge = "older" | "similar" | "younger";
export type RizzInput = {
  mode: RizzMode;
  region: RizzRegion;
  city: string;
  age_group: RizzAgeGroup;
  input_text: string;
  ui_language: "vi" | "en";
  reply_language: "vi" | "en" | "mix";
  user_gender?: RizzUserGender;
  target_gender?: RizzTargetGender;
  relative_age?: RizzRelativeAge;
  address_self?: string;
  address_other?: string;
};
export type RizzOption = { style: string; text: string; why: string };
export type RizzPayload = { options: RizzOption[]; tip: string };

const FREE_DAILY_LIMIT = 5;
const ROBOTIC = ["tất nhiên", "tôi hiểu", "dưới đây là", "là một ai", "as an ai", "certainly", "i understand", "here are"];
const RETRY_LINE = "Viết lại tự nhiên hơn, như người thật nhắn tin, không giọng trợ lý.";

export class RizzError extends Error {
  constructor(public code: "limit_reached" | "bad_ai_response" | "missing_key" | "ai_unavailable" | "rate_limited" | "credits") { super(code); }
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

async function askModel(apiKey: string, userMessage: string): Promise<string> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "fetch" },
    body: JSON.stringify({
      model: "openai/gpt-6-astra",
      instructions: SYSTEM_PROMPT,
      input: [{ role: "user", content: [{ type: "input_text", text: userMessage }] }],
      stream: true,
      store: false,
      reasoning: { effort: "low", summary: "auto" },
    }),
  });
  if (!response.ok || !response.body) {
    const detail = response.body ? await response.text() : "";
    console.error("ai gateway error", response.status, detail);
    if (response.status === 429) throw new RizzError("rate_limited");
    if (response.status === 402 || response.status === 403) throw new RizzError("credits");
    throw new RizzError("ai_unavailable");
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const event = JSON.parse(payload) as { type?: string; delta?: string; response?: { output_text?: string } };
        if (event.type === "response.output_text.delta" && typeof event.delta === "string") text += event.delta;
        else if (event.type === "response.completed" && !text && event.response?.output_text) text = event.response.output_text;
      } catch { /* ignore keep-alive lines */ }
    }
  }
  return text;
}

export const generateRizz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: RizzInput) => data)
  .handler(async ({ data, context }): Promise<RizzPayload> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
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
    let payload = parsePayload(await askModel(apiKey, baseMessage));
    if (!payload) payload = parsePayload(await askModel(apiKey, baseMessage));
    if (!payload) throw new RizzError("bad_ai_response");
    if (isRobotic(payload)) {
      const retry = parsePayload(await askModel(apiKey, `${baseMessage}\n${RETRY_LINE}`));
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
