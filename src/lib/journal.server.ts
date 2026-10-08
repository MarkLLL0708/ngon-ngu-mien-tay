// Server-only: weekly companion journal generation.
import type { SupabaseClient } from "@supabase/supabase-js";

const MODEL = "openai/gpt-6-astra";
export const JOURNAL_MOODS = ["ấm áp", "vui", "tò mò", "hơi lo", "bình yên", "phấn khích", "suy tư"];
const MAX_PER_RUN = 25;

type Companion = {
  id: string; user_id: string; name: string; address_other: string; region: string; age_vibe: string;
  personality: string; memory_summary: string; persona_slug: string;
};

export function journalSystemPrompt(name: string, other: string) {
  return `Bạn là ${name}, đang viết nhật ký riêng về tuần vừa qua với ${other} (người bạn đang trò chuyện cùng). Viết như đang tự viết nhật ký cho chính mình — không phải viết cho người đó đọc trực tiếp, mà là ghi lại cảm xúc và khoảnh khắc thật của bạn về tuần này.

Dựa trên các tin nhắn và trí nhớ dưới đây, viết một đoạn nhật ký ngắn (80-150 chữ), bằng giọng văn của bạn (đúng vùng miền, tính cách, độ tuổi đã định), kể về:
- Một khoảnh khắc hoặc câu chuyện cụ thể đáng nhớ trong tuần (không liệt kê mọi tin nhắn, chỉ chọn 1-2 điều nổi bật nhất).
- Cảm xúc thật của bạn về điều đó (vui, ấm áp, hơi lo, tò mò...).
- Có thể kết bằng một suy nghĩ nhỏ hướng tới tương lai (mong tuần sau, tò mò về điều gì đó).

KHÔNG liệt kê như báo cáo, KHÔNG viết "hôm đó bạn đã nói...". Viết như một đoạn nhật ký cá nhân thật sự — có cảm xúc, có giọng văn, có thể hơi lộn xộn như suy nghĩ thật.
Nếu tuần này có khoảnh khắc nhạy cảm (người dùng buồn, stress, chia sẻ chuyện khó khăn), được phép nhắc đến với sự quan tâm chân thành, nhưng không được suy đoán hay gán nhãn tình trạng tâm lý của họ — chỉ viết về cảm xúc của CHÍNH BẠN khi chứng kiến điều đó.
Chọn một mood_tag phù hợp: ấm áp, vui, tò mò, hơi lo, bình yên, phấn khích, suy tư.
Chỉ trả JSON: {"content": "...", "mood_tag": "..."}`;
}

class JobError extends Error { constructor(public status: number) { super(`gateway_${status}`); } }

async function askJournal(apiKey: string, system: string, input: string): Promise<{ content: string; mood_tag: string }> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "fetch" },
    body: JSON.stringify({
      model: MODEL,
      instructions: system,
      input: [{ role: "user", content: [{ type: "input_text", text: input }] }],
      stream: true, store: false,
      reasoning: { effort: "low" },
      text: { format: { type: "json_schema", name: "journal", strict: true, schema: {
        type: "object", additionalProperties: false, required: ["content", "mood_tag"],
        properties: { content: { type: "string" }, mood_tag: { type: "string", enum: JOURNAL_MOODS } },
      } } },
    }),
  });
  if (!response.ok || !response.body) {
    console.error("journal gateway error", response.status, response.body ? await response.text() : "");
    throw new JobError(response.status);
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = ""; let text = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n"); buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      try {
        const ev = JSON.parse(line.slice(5).trim()) as { type?: string; delta?: string };
        if (ev.type === "response.output_text.delta" && ev.delta) text += ev.delta;
      } catch { /* keep-alive */ }
    }
  }
  const parsed = JSON.parse(text) as { content?: string; mood_tag?: string };
  const content = (parsed.content ?? "").trim();
  if (!content) throw new Error("empty_journal");
  return { content, mood_tag: JOURNAL_MOODS.includes(parsed.mood_tag ?? "") ? parsed.mood_tag! : "bình yên" };
}

const CATEGORY_HINTS: [RegExp, string[]][] = [
  [/cà phê|cafe|coffee/i, ["coffee", "cafe", "cà phê"]],
  [/ăn|món|nấu|food/i, ["food", "đồ ăn", "ăn uống"]],
  [/mưa|trời|nắng|sky/i, ["sky", "weather", "trời"]],
  [/đi dạo|phố|đường|street/i, ["street", "city", "phố"]],
  [/làm việc|công việc|deadline|work/i, ["work", "desk", "công việc"]],
];

/** Same shared/persona pools used by in-chat image moments. */
async function pickImage(admin: SupabaseClient, companion: Companion, content: string) {
  let personaId: string | null = null;
  if (companion.persona_slug) {
    const { data } = await admin.from("personas").select("id").eq("slug", companion.persona_slug).maybeSingle();
    personaId = (data as { id: string } | null)?.id ?? null;
  }
  const filter = personaId ? `companion_id.eq.${companion.id},persona_id.eq.${personaId}` : `companion_id.eq.${companion.id}`;
  const [{ data: mine }, { data: shared }] = await Promise.all([
    admin.from("persona_image_moments").select("id, category").or(filter).limit(40),
    admin.from("shared_image_moments").select("id, category").eq("active", true).limit(200),
  ]);
  const pools = [
    ...((mine ?? []) as { id: string; category: string }[]).map((r) => ({ ...r, source: "persona" as const })),
    ...((shared ?? []) as { id: string; category: string }[]).map((r) => ({ ...r, source: "shared" as const })),
  ];
  if (!pools.length) return null;
  const wanted = CATEGORY_HINTS.find(([re]) => re.test(content))?.[1] ?? [];
  const matched = pools.filter((p) => wanted.some((w) => p.category.toLowerCase().includes(w)));
  const list = matched.length ? matched : pools;
  return list[Math.floor(Math.random() * list.length)]!;
}

export async function runWeeklyJournal(admin: SupabaseClient, apiKey: string, opts: { companionId?: string | undefined; windowDays?: number | undefined } = {}) {
  const since = new Date(Date.now() - (opts.windowDays ?? 7) * 86400000).toISOString();
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = since.slice(0, 10);

  const { data: recent } = await admin.from("companion_messages").select("companion_id")
    .eq("role", "user").gte("created_at", since).limit(5000);
  const counts = new Map<string, number>();
  for (const r of (recent ?? []) as { companion_id: string }[]) counts.set(r.companion_id, (counts.get(r.companion_id) ?? 0) + 1);
  let eligible = [...counts.entries()].filter(([, n]) => n >= 3).map(([id]) => id);
  if (opts.companionId) eligible = eligible.filter((id) => id === opts.companionId);

  // Idempotent: skip companions that already got an entry this week.
  const { data: done } = eligible.length
    ? await admin.from("companion_journal_entries").select("companion_id").in("companion_id", eligible).gt("entry_date", weekAgo)
    : { data: [] };
  const skip = new Set(((done ?? []) as { companion_id: string }[]).map((r) => r.companion_id));
  const todo = eligible.filter((id) => !skip.has(id)).slice(0, MAX_PER_RUN);

  const results: { companion_id: string; ok: boolean; error?: string }[] = [];
  for (const companionId of todo) {
    try {
      const { data: c } = await admin.from("companions")
        .select("id, user_id, name, address_other, region, age_vibe, personality, memory_summary, persona_slug")
        .eq("id", companionId).maybeSingle();
      if (!c) continue;
      const companion = c as Companion;
      const [{ data: msgs }, { data: mems }] = await Promise.all([
        admin.from("companion_messages").select("role, content, created_at").eq("companion_id", companionId)
          .gte("created_at", since).order("created_at", { ascending: true }).limit(200),
        admin.from("companion_memories").select("fact").eq("companion_id", companionId)
          .order("pinned", { ascending: false }).limit(30),
      ]);
      const transcript = ((msgs ?? []) as { role: string; content: string }[])
        .map((m) => `${m.role === "assistant" ? companion.name : companion.address_other}: ${m.content}`).join("\n").slice(-12000);
      const input = [
        `Hồ sơ: ${companion.name}, ${companion.age_vibe} tuổi, vùng ${companion.region}, tính cách: ${companion.personality}.`,
        `Tóm tắt trí nhớ: ${companion.memory_summary || "(chưa có)"}`,
        `Điều bạn nhớ: ${((mems ?? []) as { fact: string }[]).map((m) => m.fact).join("; ") || "(chưa có)"}`,
        `Tin nhắn 7 ngày qua:\n${transcript}`,
      ].join("\n\n");
      const entry = await askJournal(apiKey, journalSystemPrompt(companion.name, companion.address_other || "anh"), input);
      const image = Math.random() < 1 / 3 ? await pickImage(admin, companion, entry.content) : null;
      const { error } = await admin.from("companion_journal_entries").insert({
        companion_id: companionId, user_id: companion.user_id, entry_date: today,
        content: entry.content, mood_tag: entry.mood_tag,
        image_source: image?.source ?? null, image_id: image?.id ?? null,
      });
      if (error) throw new Error(error.message);
      results.push({ companion_id: companionId, ok: true });
    } catch (error) {
      // Circuit breaker: stop the whole run on credit/policy/rate-limit failures.
      if (error instanceof JobError && [402, 403, 429].includes(error.status)) {
        results.push({ companion_id: companionId, ok: false, error: error.message });
        return { processed: results, halted: error.message };
      }
      console.error("journal entry failed", companionId, error);
      results.push({ companion_id: companionId, ok: false, error: "failed" });
    }
  }
  return { processed: results, halted: null };
}
