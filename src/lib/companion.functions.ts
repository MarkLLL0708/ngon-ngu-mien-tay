import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { buildSystemPrompt, type CompanionPersona } from "./companion.prompt";

export type CompanionInput = { companion_id: string; message: string };
export type CompanionPayload = { reply: string };

const FREE_DAILY_MESSAGES = 30;
const HISTORY_LIMIT = 20;
const TEST_DAILY_MESSAGES = 100;

export class CompanionError extends Error {
  constructor(public code: "limit_reached" | "age_not_confirmed" | "not_found" | "missing_key" | "ai_unavailable" | "rate_limited" | "credits") {
    super(code);
  }
}

type Turn = { role: "user" | "assistant"; content: string };

async function askModel(apiKey: string, system: string, turns: Turn[]): Promise<string> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "fetch" },
    body: JSON.stringify({
      model: "openai/gpt-6-astra",
      instructions: system,
      input: turns.map((turn) => ({
        role: turn.role,
        content: [{ type: turn.role === "user" ? "input_text" : "output_text", text: turn.content }],
      })),
      stream: true,
      store: false,
      reasoning: { effort: "low", summary: "auto" },
    }),
  });
  if (!response.ok || !response.body) {
    const detail = response.body ? await response.text() : "";
    console.error("companion gateway error", response.status, detail);
    if (response.status === 429) throw new CompanionError("rate_limited");
    if (response.status === 402 || response.status === 403) throw new CompanionError("credits");
    throw new CompanionError("ai_unavailable");
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
      } catch { /* keep-alive */ }
    }
  }
  return text;
}

function clean(reply: string) {
  return reply
    .replace(/[*#`_]/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 3)
    .join("\n")
    .trim();
}

export const companionReply = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: CompanionInput) => data)
  .handler(async ({ data, context }): Promise<CompanionPayload> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new CompanionError("missing_key");
    const { supabase, userId } = context;

    const { data: profile } = await supabase
      .from("profiles")
      .select("age_confirmed, subscription_status, gender")
      .eq("id", userId)
      .maybeSingle();
    if (!profile?.age_confirmed) throw new CompanionError("age_not_confirmed");

    const { data: companion } = await supabase
      .from("companions")
      .select("name, region, city, job, age_vibe, personality, persona_gender, persona_style, address_self, address_other, memory_summary, mode, chat_language")
      .eq("id", data.companion_id)
      .maybeSingle();
    if (!companion) throw new CompanionError("not_found");

    if ((profile.subscription_status ?? "free") !== "pro") {
      const since = new Date();
      since.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from("companion_messages")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("role", "user")
        .gte("created_at", since.toISOString());
      const dailyMessages = process.env["TEST_MODE"] === "true" ? TEST_DAILY_MESSAGES : FREE_DAILY_MESSAGES;
      if ((count ?? 0) >= dailyMessages) throw new CompanionError("limit_reached");
    }

    const { data: history } = await supabase
      .from("companion_messages")
      .select("role, content, created_at")
      .eq("companion_id", data.companion_id)
      .order("created_at", { ascending: false })
      .limit(HISTORY_LIMIT);

    const turns: Turn[] = (history ?? [])
      .slice()
      .reverse()
      .map((row) => ({ role: row.role === "assistant" ? "assistant" : "user", content: row.content }));
    const message = data.message.trim().slice(0, 1000);
    turns.push({ role: "user", content: message });

    const system = buildSystemPrompt(companion as CompanionPersona, profile.gender ?? "unspecified");
    const reply = clean(await askModel(apiKey, system, turns));
    if (!reply) throw new CompanionError("ai_unavailable");

    await supabase.from("companion_messages").insert([
      { user_id: userId, companion_id: data.companion_id, role: "user", content: message },
      { user_id: userId, companion_id: data.companion_id, role: "assistant", content: reply },
    ]);

    if (turns.length >= HISTORY_LIMIT) {
      const summaryTurns: Turn[] = [
        ...turns,
        { role: "user", content: "Tóm tắt ngắn (tối đa 4 câu) những điều nên nhớ về người dùng: tên, công việc, sở thích, chuyện đang diễn ra. Chỉ trả về phần tóm tắt." },
      ];
      try {
        const summary = (await askModel(apiKey, system, summaryTurns)).trim().slice(0, 800);
        if (summary) await supabase.from("companions").update({ memory_summary: summary }).eq("id", data.companion_id);
      } catch { /* memory refresh is best-effort */ }
    }

    return { reply };
  });
