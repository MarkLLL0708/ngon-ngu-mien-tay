import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, MoreVertical, Phone, SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Paywall } from "./Paywall";
import { useLang } from "./Language";
import { callFunction, readReplyLanguageSafe, sampleCompanionReply } from "@/lib/tangpt-chat";
import { supabase } from "@/integrations/supabase/client";

type Message = { id: string; from: "me" | "her"; text: string; status?: "sent" | "seen" };
type Companion = { id: string; name: string; personality: string; mode: string };

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const gap = () => 300 + Math.random() * 600;
const typingTime = (text: string) => Math.min(3500, Math.max(700, text.length * 40));

export function ChatScreen({ companionId }: { companionId: string }) {
  const { t } = useLang();
  const navigate = useNavigate();
  const [companion, setCompanion] = useState<Companion | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const [paywall, setPaywall] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    supabase.from("companions").select("id, name, personality, mode").eq("id", companionId).maybeSingle()
      .then(({ data }) => { if (active && data) setCompanion(data as Companion); });
    return () => { active = false; };
  }, [companionId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, typing]);

  async function send() {
    const value = draft.trim();
    if (!value || typing) return;
    const mine: Message = { id: crypto.randomUUID(), from: "me", text: value, status: "sent" };
    setMessages((list) => [...list, mine]);
    setDraft("");
    setTyping(true);

    const outcome = await callFunction<{ reply?: string }>("companion", { companion_id: companionId, message: value });
    if (outcome.code === "limit_reached") { setTyping(false); setPaywall(true); return; }
    if (outcome.code === "age_not_confirmed") { setTyping(false); navigate({ to: "/onboarding" }); return; }

    const reply = outcome.data?.reply?.trim() || sampleCompanionReply(companion?.name ?? "", readReplyLanguageSafe());
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
  return <main className="chat-screen">
    <header className="chat-header">
      <Button asChild variant="ghost" size="icon" aria-label={t("Quay lại", "Back")}><Link to="/app/ai"><ArrowLeft /></Link></Button>
      <div className="avatar-orbit tiny"><span>{name[0]}</span></div>
      <div className="min-w-0"><strong>{name} <i className="ai-chip">AI</i></strong><small>{companion?.personality ?? t("Đang tải", "Loading")} · {t("đang hoạt động", "online")}</small></div>
      <Button variant="ghost" size="icon" aria-label={t("Gọi thoại", "Call")}><Phone /></Button>
      <Button variant="ghost" size="icon" aria-label={t("Tùy chọn", "Options")}><MoreVertical /></Button>
    </header>
    <div className="chat-thread">
      {messages.length === 0 && <p className="chat-hint">{t("Nhắn một câu để bắt đầu nha. Đây là nhân vật AI, không phải người thật.", "Send a message to begin. This is an AI character, not a real person.")}</p>}
      {messages.map((message) => <div key={message.id} className={message.from === "me" ? "msg msg-me" : "msg msg-her"}>
        <p>{message.text}</p>
        {message.from === "me" && <small>{message.status === "seen" ? t("Đã xem", "Seen") : t("Đã gửi", "Sent")}</small>}
      </div>)}
      {typing && <div className="typing"><i /><i /><i /></div>}
      <div ref={endRef} />
    </div>
    <div className="chat-composer">
      <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void send(); }} placeholder={t("Nhắn gì đó...", "Say something...")} />
      <Button variant="gradient" size="icon" onClick={send} disabled={!draft.trim() || typing} aria-label={t("Gửi", "Send")}><SendHorizontal /></Button>
    </div>
    <Paywall open={paywall} onOpenChange={setPaywall} />
  </main>;
}
