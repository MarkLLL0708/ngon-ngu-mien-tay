import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, MoreVertical, Phone, SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Paywall } from "./Paywall";
import { useLang } from "./Language";
import { companionReply } from "@/lib/companion.functions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Message = { id: string; from: "me" | "her"; text: string; status?: "sent" | "seen" };
type Companion = { id: string; name: string; personality: string; mode: string; region: string; address_self: string; address_other: string };

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const gap = () => 300 + Math.random() * 600;
const typingTime = (text: string) => Math.min(3500, Math.max(700, text.length * 40));

function quickChips(region: string, other: string, vi: boolean): string[] {
  if (!vi) return ["Have you eaten yet?", "How was your day?", "Free this weekend?", "Tell me something fun"];
  if (region === "nam") return [`Ăn tối chưa ${other}?`, `Hôm nay của ${other} sao rồi nè?`, `Cuối tuần này ${other} rảnh hông?`, `Kể chuyện vui đi ${other}`];
  if (region === "trung") return [`Ăn tối chưa ${other}?`, `Hôm ni của ${other} răng rồi?`, `Cuối tuần ni ${other} rảnh không nghe?`, `Kể chuyện vui đi ${other}`];
  if (region === "tay") return [`Ăn tối chưa ${other}?`, `Hôm nay của ${other} sao rồi nghen?`, `Cuối tuần này ${other} rảnh hôn?`, `Kể chuyện vui đi ${other}`];
  return [`Ăn tối chưa ${other}?`, `Hôm nay của ${other} thế nào?`, `Cuối tuần này ${other} rảnh không nhé?`, `Kể chuyện vui đi ${other}`];
}

const PAIRS: [string, string][] = [["mình", "bạn"], ["em", "anh"], ["anh", "em"], ["tớ", "cậu"], ["tui", "bạn"]];

export function ChatScreen({ companionId }: { companionId: string }) {
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const [companion, setCompanion] = useState<Companion | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const [paywall, setPaywall] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("companions")
        .select("id, name, personality, mode, region, address_self, address_other")
        .eq("id", companionId)
        .maybeSingle();
      if (active && data) setCompanion(data as Companion);
      const { data: rows } = await supabase
        .from("companion_messages")
        .select("id, role, content")
        .eq("companion_id", companionId)
        .order("created_at", { ascending: true });
      if (active && rows) {
        setMessages(rows.map((row) => ({ id: row.id, from: row.role === "assistant" ? "her" : "me", text: row.content, status: "seen" })));
      }
    })();
    return () => { active = false; };
  }, [companionId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, typing]);

  async function savePair(self: string, other: string) {
    if (!companion) return;
    setCompanion({ ...companion, address_self: self, address_other: other });
    setMenuOpen(false);
    await supabase.from("companions").update({ address_self: self, address_other: other }).eq("id", companion.id);
    toast.success(t("Đã đổi cách xưng hô", "Address pair updated"));
  }

  async function send(value: string) {
    const text = value.trim();
    if (!text || typing) return;
    const mine: Message = { id: crypto.randomUUID(), from: "me", text, status: "sent" };
    setMessages((list) => [...list, mine]);
    setDraft("");
    setTyping(true);

    let reply = "";
    try {
      const result = await companionReply({ data: { companion_id: companionId, message: text } });
      reply = result.reply;
    } catch (error) {
      setTyping(false);
      const raw = error instanceof Error ? error.message : String(error);
      if (raw.includes("limit_reached")) { setPaywall(true); return; }
      if (raw.includes("age_not_confirmed")) { navigate({ to: "/onboarding" }); return; }
      if (raw.includes("credits")) { toast.error(t("Hết lượt AI của ứng dụng, thử lại sau nha.", "The app's AI quota is used up, please try later.")); return; }
      if (raw.includes("rate_limited")) { toast.error(t("Nhắn hơi nhanh rồi, chờ chút nha.", "Too many messages, please slow down.")); return; }
      toast.error(t("Chưa gửi được, thử lại giúp mình nha.", "Could not send, please try again."));
      return;
    }

    setMessages((list) => list.map((item) => (item.id === mine.id ? { ...item, status: "seen" } : item)));
    const lines = reply.split("\n").map((line) => line.trim()).filter(Boolean);
    for (const line of lines) {
      setTyping(true);
      await wait(typingTime(line));
      setTyping(false);
      setMessages((list) => [...list, { id: crypto.randomUUID(), from: "her", text: line }]);
      await wait(gap());
    }
    setTyping(false);
  }

  const name = companion?.name ?? t("Nhân vật", "Character");
  const chips = quickChips(companion?.region ?? "bac", companion?.address_other ?? t("bạn", "you"), lang === "vi");

  return <main className="chat-screen">
    <header className="chat-header">
      <Button asChild variant="ghost" size="icon" aria-label={t("Quay lại", "Back")}><Link to="/app/ai"><ArrowLeft /></Link></Button>
      <div className="avatar-orbit tiny"><span>{name[0]}</span></div>
      <div className="min-w-0"><strong>{name} <i className="ai-chip">AI</i></strong><small>{companion?.personality ?? t("Đang tải", "Loading")} · {t("đang hoạt động", "online")}</small></div>
      <Button variant="ghost" size="icon" aria-label={t("Gọi thoại", "Call")}><Phone /></Button>
      <Button variant="ghost" size="icon" aria-label={t("Tùy chọn", "Options")} onClick={() => setMenuOpen((open) => !open)}><MoreVertical /></Button>
    </header>
    {menuOpen && companion && <div className="chat-menu fade-up">
      <p>{t("Cách xưng hô", "Address pair")}: <strong>{companion.address_self} - {companion.address_other}</strong></p>
      <div className="flex flex-wrap gap-2">{PAIRS.map(([self, other]) => {
        const active = companion.address_self === self && companion.address_other === other;
        return <button type="button" key={`${self}-${other}`} className={active ? "chip chip-active" : "chip"} onClick={() => void savePair(self, other)}>
          {self} - {other}{active ? <Check size={14} /> : null}
        </button>;
      })}</div>
    </div>}
    <div className="chat-thread">
      {messages.length === 0 && <>
        <p className="chat-hint">{t("Nhắn một câu để bắt đầu nha. Đây là nhân vật AI, không phải người thật.", "Send a message to begin. This is an AI character, not a real person.")}</p>
        <div className="flex flex-wrap gap-2 justify-center">{chips.map((chip) => <button type="button" key={chip} className="chip" onClick={() => void send(chip)}>{chip}</button>)}</div>
      </>}
      {messages.map((message) => <div key={message.id} className={message.from === "me" ? "msg msg-me" : "msg msg-her"}>
        <p>{message.text}</p>
        {message.from === "me" && <small>{message.status === "seen" ? t("Đã xem", "Seen") : t("Đã gửi", "Sent")}</small>}
      </div>)}
      {typing && <div className="typing"><i /><i /><i /></div>}
      <div ref={endRef} />
    </div>
    <div className="chat-composer">
      <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void send(draft); }} placeholder={t("Nhắn gì đó...", "Say something...")} />
      <Button variant="gradient" size="icon" onClick={() => void send(draft)} disabled={!draft.trim() || typing} aria-label={t("Gửi", "Send")}><SendHorizontal /></Button>
    </div>
    <Paywall open={paywall} onOpenChange={setPaywall} />
  </main>;
}
