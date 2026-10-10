import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const REGION_VOICE: Record<string, string> = {
  bac: "giọng Hà Nội (nhé, ạ, thế, ghê cơ)",
  nam: "giọng Sài Gòn (nha, nè, hông, dzậy)",
  trung: "giọng miền Trung (hỉ, rứa, chi, răng)",
  tay: "giọng miền Tây (nghen, hông, quá trời, dữ thần)",
};

/** Admin-only: draft one short Moments caption in the persona's voice. Never publishes. */
export const suggestMomentCaption = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { persona_id: string; hint?: string }) => {
    if (!/^[0-9a-f-]{36}$/i.test(data?.persona_id ?? "")) throw new Error("invalid");
    return { persona_id: data.persona_id, hint: String(data.hint ?? "").slice(0, 200) };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: ok } = await supabase.rpc("is_persona_admin", { _user_id: userId });
    if (!ok) throw new Error("forbidden");
    const { data: p } = await supabase.from("personas")
      .select("name, age_vibe, region, city, job, personality, backstory, daily_life, quirks, catchphrase")
      .eq("id", data.persona_id).maybeSingle();
    if (!p) throw new Error("not_found");
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("config");
    const system = `Bạn là ${p.name}, ${p.age_vibe} tuổi, sống ở ${p.city}, làm ${p.job}. Tính cách: ${p.personality}. Tiểu sử: ${p.backstory}. Đời thường: ${p.daily_life}. Nét riêng: ${p.quirks}. Câu cửa miệng: ${p.catchphrase}.
Viết MỘT caption ngắn (tối đa 15 chữ) cho bài đăng khoảnh khắc kiểu story, bằng ${REGION_VOICE[p.region] ?? "giọng tự nhiên"}, viết thường như nhắn tin thật, có thể 1 emoji. Ví dụ: "cà phê sáng nay nhẹ nhàng ghê ☕", "nay hơi mệt, về sớm thôi". Chỉ trả caption, không ngoặc kép.`;
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "fetch" },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        messages: [{ role: "system", content: system }, { role: "user", content: data.hint ? `Ảnh: ${data.hint}` : "Viết caption." }],
      }),
    });
    if (res.status === 402) throw new Error("no_credits");
    if (!res.ok) throw new Error("ai_unavailable");
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const caption = (json.choices?.[0]?.message?.content ?? "").trim().replace(/^["“]|["”]$/g, "");
    return { caption };
  });
