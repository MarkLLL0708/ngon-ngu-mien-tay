import { supabase } from "@/integrations/supabase/client";

export type ReplyLanguage = "vi" | "en" | "both";
export type RizzOption = { style: string; text: string; why: string };
export type RizzResult = { options: RizzOption[]; tip: string; sample?: boolean };
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

export function sampleRizz(mode: "reply" | "opener", language: ReplyLanguage): RizzResult {
  const vi: RizzOption[] = mode === "reply"
    ? [
        { style: "Vui vẻ", text: "Mệt dữ vậy hả. Cho mình ship qua một phần năng lượng tích cực được không nè?", why: "Nhẹ nhàng, có chút trêu và mở đường cho em ấy kể thêm." },
        { style: "Chân thành", text: "Nghe thương quá. Em nghỉ ngơi chút đi nha, hôm nay có chuyện gì làm em mệt vậy?", why: "Quan tâm thật lòng mà không vồ vập." },
        { style: "Tự tin", text: "Tối nay cứ nghỉ cho khỏe. Cuối tuần để mình bù cho em một buổi thật vui nhé.", why: "Chủ động vừa đủ, có lời mời rõ ràng nhưng vẫn tôn trọng." },
      ]
    : [
        { style: "Vui vẻ", text: "Thấy hình em đi cà phê mà mình cũng thèm theo. Quán đó đáng đi thiệt không nè?", why: "Bắt đầu từ điều em ấy thích, rất dễ trả lời." },
        { style: "Chân thành", text: "Chào em, mình thấy tụi mình có vẻ hợp gu nhạc. Em hay nghe gì lúc cuối ngày vậy?", why: "Tìm điểm chung trước khi tán, tạo cảm giác an toàn." },
        { style: "Tự tin", text: "Mình ít khi chủ động nhắn trước, nhưng lần này thấy tiếc nếu không thử. Làm quen nha?", why: "Thẳng thắn, tự tin nhưng vẫn để em ấy có quyền chọn." },
      ];
  const en: RizzOption[] = mode === "reply"
    ? [
        { style: "Playful", text: "That sounds exhausting. Want me to send over some spare good energy?", why: "Light and teasing, leaves room for her to open up." },
        { style: "Sincere", text: "That's rough. Get some rest tonight - what made today so heavy?", why: "Shows real care without being pushy." },
        { style: "Confident", text: "Rest up tonight. Let me make it up to you with something fun this weekend.", why: "Clear invitation while still respecting her space." },
      ]
    : [
        { style: "Playful", text: "Your coffee photo just made me thirsty. Is that place actually worth the trip?", why: "Starts from her interest, very easy to answer." },
        { style: "Sincere", text: "Hi! Looks like we have the same taste in music. What do you listen to at the end of the day?", why: "Finds common ground first, feels safe." },
        { style: "Confident", text: "I don't usually message first, but I'd regret not trying. Mind if we get to know each other?", why: "Direct and confident while leaving her the choice." },
      ];
  const options = language === "en" ? en : language === "both"
    ? vi.map((option, index) => ({ ...option, text: `${option.text}\n${en[index]?.text ?? ""}` }))
    : vi;
  return {
    options,
    tip: language === "en"
      ? "Ask one question, then wait. Caring isn't the same as interviewing."
      : "Hỏi một câu thôi rồi chờ em ấy trả lời. Quan tâm không có nghĩa là phỏng vấn nha.",
    sample: true,
  };
}

export function sampleCompanionReply(name: string, language: ReplyLanguage): string {
  if (language === "en") return `Hey, it's ${name}.\nI just got home. How was your day?`;
  if (language === "both") return `Hi, ${name} nè.\nMới về tới nhà nè. Hôm nay của anh sao rồi?\n(How was your day?)`;
  return `Ủa, nhắn nè.\nMới về tới nhà à. Hôm nay của anh sao rồi?`;
}
