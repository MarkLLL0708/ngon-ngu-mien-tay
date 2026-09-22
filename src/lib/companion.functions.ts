import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { WELCOME_BACK_HOURS } from "./tangpt-config";
import { buildSystemPrompt, IMAGE_CAPTION_PROMPT, IMAGE_TURN_INSTRUCTION, type Continuity, type CompanionPersona } from "./companion.prompt";

export type CompanionInput = { companion_id: string; message?: string; mode?: "chat" | "welcome_back"; image_data?: string };
export type CompanionPayload = { reply: string };

const FREE_DAILY_MESSAGES = 30;
const HISTORY_LIMIT = 30;
const TEST_DAILY_MESSAGES = 100;
const MEMORY_LIMIT = 40;
const MEMORY_EVERY = 6;
const SUMMARY_EVERY = 20;
const REMEMBER_TRIGGERS = ["nhớ nhé", "nhớ giúp", "remember"];
const CATEGORIES = ["basic", "work", "interests", "plans", "people", "preferences", "events"];

export class CompanionError extends Error {
  constructor(public code: "limit_reached" | "age_not_confirmed" | "not_found" | "missing_key" | "ai_unavailable" | "rate_limited" | "credits") {
    super(code);
  }
}

type Turn = { role: "user" | "assistant"; content: string; image?: string };

const IMAGE_PREFIX = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;
function safeImage(value: unknown): string | null {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw || !IMAGE_PREFIX.test(raw)) return null;
  // ~8 MB nhị phân sau khi base64 hoá
  if (raw.length > 12_000_000) return null;
  return raw;
}

async function askModel(apiKey: string, system: string, turns: Turn[]): Promise<string> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "fetch" },
    body: JSON.stringify({
      model: "openai/gpt-6-astra",
      instructions: system,
      input: turns.map((turn) => ({
        role: turn.role,
        content: turn.role === "user" && turn.image
          ? [{ type: "input_image", image_url: turn.image }, { type: "input_text", text: turn.content || "(người dùng gửi ảnh, không kèm chữ)" }]
          : [{ type: turn.role === "user" ? "input_text" : "output_text", text: turn.content }],
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

const WEEKDAYS = ["Chủ nhật", "thứ hai", "thứ ba", "thứ tư", "thứ năm", "thứ sáu", "thứ bảy"];

function vnNow() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    weekday: "short", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hour12: false,
  }).formatToParts(now);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  const weekdayIndex = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  const hour = Number.parseInt(get("hour"), 10) % 24;
  const partOfDay = hour < 5 ? "khuya" : hour < 11 ? "sáng" : hour < 13 ? "trưa" : hour < 18 ? "chiều" : hour < 23 ? "tối" : "khuya";
  return {
    weekday: WEEKDAYS[weekdayIndex < 0 ? 0 : weekdayIndex] ?? "hôm nay",
    date: `ngày ${get("day")}/${get("month")}/${get("year")}`,
    partOfDay: `${partOfDay} (${hour} giờ)`,
    hour,
  };
}

function gapText(last: string | null): string {
  if (!last) return "chưa có tin nhắn nào trước đây";
  const ms = Date.now() - new Date(last).getTime();
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${Math.max(minutes, 1)} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "hôm qua";
  return `${days} ngày trước`;
}

type MemoryRow = { id: string; fact: string; category: string; pinned: boolean };

function parseJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try { return JSON.parse(text.slice(start, end + 1)); } catch { return null; }
}

const EXTRACT_PROMPT = `Bạn cập nhật bộ nhớ về người dùng cho một ứng dụng trò chuyện. Chỉ ghi những điều người dùng TỰ NÓI, ngắn gọn, mỗi ý một dòng, tiếng Việt: tên gọi, nghề nghiệp, nơi ở, sở thích, thói quen, kế hoạch sắp tới (kèm ngày nếu có), người thân và bạn bè họ hay nhắc, món ăn thích, điều họ dặn bạn nhớ.

KHÔNG BAO GIỜ ghi: sức khỏe thể chất hoặc tâm lý, xu hướng tình dục hay bản dạng giới, tôn giáo, chính trị, thu nhập hay số tiền, nợ nần, số căn cước, số thẻ, mật khẩu, địa chỉ nhà, số điện thoại, chuyện phạm pháp, chuyện bị xâm hại, ý định tự làm hại bản thân, thông tin về trẻ em, hay chi tiết nhạy cảm của người khác. Không suy đoán, không kết luận về tính cách.

Nếu thông tin mới mâu thuẫn với thông tin cũ, cập nhật thông tin cũ. Gộp các ý trùng nhau. Tối đa 60 ý. Bỏ những kế hoạch đã qua.

Chỉ trả về JSON hợp lệ: {"add":[{"fact":"...","category":"basic|work|interests|plans|people|preferences|events"}],"update":[{"id":"...","fact":"..."}],"delete":["id"]}`;

const SUMMARY_PROMPT = `Bạn viết lại bản tóm tắt cuộc trò chuyện cho một ứng dụng nhắn tin. Gộp bản tóm tắt cũ với các tin nhắn mới thành một bản tóm tắt tiếng Việt tối đa 200 từ: hai người nói chuyện với nhau kiểu gì, những câu đùa quen thuộc, các chủ đề đã bàn. Không ghi sức khỏe, tâm lý, xu hướng tính dục, tôn giáo, chính trị, tiền bạc, giấy tờ, địa chỉ, số điện thoại hay chuyện nhạy cảm của người khác. Chỉ trả về phần tóm tắt.`;

export const companionReply = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: CompanionInput) => data)
  .handler(async ({ data, context }): Promise<CompanionPayload> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new CompanionError("missing_key");
    const { supabase, userId } = context;
    const welcomeBack = data.mode === "welcome_back";

    const { data: profile } = await supabase
      .from("profiles")
      .select("age_confirmed, subscription_status, gender")
      .eq("id", userId)
      .maybeSingle();
    if (!profile?.age_confirmed) throw new CompanionError("age_not_confirmed");

    const { data: companion } = await supabase
      .from("companions")
      .select("name, region, city, job, age_vibe, personality, persona_gender, persona_style, address_self, address_other, memory_summary, mode, chat_language, last_message_at, welcome_enabled")
      .eq("id", data.companion_id)
      .maybeSingle();
    if (!companion) throw new CompanionError("not_found");

    const lastAt = (companion as { last_message_at: string | null }).last_message_at ?? null;

    if (welcomeBack) {
      if ((companion as { welcome_enabled: boolean }).welcome_enabled === false) return { reply: "" };
      if (lastAt && Date.now() - new Date(lastAt).getTime() < WELCOME_BACK_HOURS * 3600000) return { reply: "" };
    }

    if (!welcomeBack && (profile.subscription_status ?? "free") !== "pro") {
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

    const { data: memoryRows } = await supabase
      .from("companion_memories")
      .select("id, fact, category, pinned")
      .eq("companion_id", data.companion_id)
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(MEMORY_LIMIT);
    const memories = (memoryRows ?? []) as MemoryRow[];

    const turns: Turn[] = (history ?? [])
      .slice()
      .reverse()
      .map((row) => ({ role: row.role === "assistant" ? "assistant" : "user", content: row.content }));
    const message = (data.message ?? "").trim().slice(0, 1000);
    if (welcomeBack) turns.push({ role: "user", content: "[người dùng vừa mở lại cuộc trò chuyện]" });
    else turns.push({ role: "user", content: message });

    const clock = vnNow();
    const continuity: Continuity = {
      facts: memories.map((row) => row.fact),
      weekday: clock.weekday,
      date: clock.date,
      partOfDay: clock.partOfDay,
      gap: gapText(lastAt),
      welcomeBack,
    };

    const system = buildSystemPrompt(companion as unknown as CompanionPersona, profile.gender ?? "unspecified", continuity);
    const reply = clean(await askModel(apiKey, system, turns));
    if (!reply) throw new CompanionError("ai_unavailable");

    const rows = welcomeBack
      ? [{ user_id: userId, companion_id: data.companion_id, role: "assistant", content: reply }]
      : [
          { user_id: userId, companion_id: data.companion_id, role: "user", content: message },
          { user_id: userId, companion_id: data.companion_id, role: "assistant", content: reply },
        ];
    await supabase.from("companion_messages").insert(rows);

    const lastBubble = reply.split("\n").filter(Boolean).pop() ?? reply;
    await supabase
      .from("companions")
      .update({ last_message_at: new Date().toISOString(), last_message_preview: lastBubble.slice(0, 60) })
      .eq("id", data.companion_id);

    if (welcomeBack) return { reply };

    const { count: userCount } = await supabase
      .from("companion_messages")
      .select("id", { count: "exact", head: true })
      .eq("companion_id", data.companion_id)
      .eq("role", "user");
    const userMessages = userCount ?? 0;
    const asked = REMEMBER_TRIGGERS.some((word) => message.toLowerCase().includes(word));

    if (asked || (userMessages > 0 && userMessages % MEMORY_EVERY === 0)) {
      try {
        const factsBlock = memories.length
          ? memories.map((row) => `${row.id} [${row.category}]${row.pinned ? " (ghim)" : ""}: ${row.fact}`).join("\n")
          : "(chưa có)";
        const recent = turns.slice(-12).map((turn) => `${turn.role === "user" ? "Người dùng" : "Nhân vật"}: ${turn.content}`).join("\n");
        const raw = await askModel(apiKey, EXTRACT_PROMPT, [
          { role: "user", content: `Các ý đang nhớ (kèm id):\n${factsBlock}\n\n12 tin nhắn gần nhất:\n${recent}` },
        ]);
        const parsed = parseJson(raw) as {
          add?: { fact?: string; category?: string }[];
          update?: { id?: string; fact?: string }[];
          delete?: string[];
        } | null;
        if (parsed) {
          const pinnedIds = new Set(memories.filter((row) => row.pinned).map((row) => row.id));
          const additions = (parsed.add ?? [])
            .filter((item) => typeof item.fact === "string" && item.fact.trim())
            .slice(0, 20)
            .map((item) => ({
              user_id: userId,
              companion_id: data.companion_id,
              fact: item.fact!.trim().slice(0, 300),
              category: CATEGORIES.includes(item.category ?? "") ? item.category! : "basic",
            }));
          if (additions.length) await supabase.from("companion_memories").insert(additions);
          for (const item of parsed.update ?? []) {
            if (!item.id || !item.fact || pinnedIds.has(item.id)) continue;
            await supabase
              .from("companion_memories")
              .update({ fact: item.fact.trim().slice(0, 300), updated_at: new Date().toISOString() })
              .eq("id", item.id)
              .eq("user_id", userId);
          }
          const removals = (parsed.delete ?? []).filter((id) => typeof id === "string" && !pinnedIds.has(id));
          if (removals.length) await supabase.from("companion_memories").delete().in("id", removals).eq("user_id", userId);
        }
      } catch (error) { console.error("memory extraction failed", error); }
    }

    if (userMessages > 0 && userMessages % SUMMARY_EVERY === 0) {
      try {
        const transcript = turns.map((turn) => `${turn.role === "user" ? "Người dùng" : "Nhân vật"}: ${turn.content}`).join("\n");
        const summary = (await askModel(apiKey, SUMMARY_PROMPT, [
          { role: "user", content: `Tóm tắt cũ:\n${companion.memory_summary || "(chưa có)"}\n\nTin nhắn gần đây:\n${transcript}` },
        ])).trim().slice(0, 1500);
        if (summary) await supabase.from("companions").update({ memory_summary: summary }).eq("id", data.companion_id);
      } catch (error) { console.error("summary refresh failed", error); }
    }

    return { reply };
  });
