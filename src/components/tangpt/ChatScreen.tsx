import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Brain, Check, LoaderCircle, MoreVertical, Pause, Phone, Play, SendHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Paywall } from "./Paywall";
import { useLang } from "./Language";
import { MemorySheet } from "./MemorySheet";
import { companionReply } from "@/lib/companion.functions";
import { supabase } from "@/integrations/supabase/client";
import { dayLabel, personaPronoun } from "@/lib/tangpt-companions";
import { toast } from "sonner";
import { CallScreen } from "./CallScreen";
import { useCompanionVoice } from "@/lib/voice-player";
import { VOICE_MESSAGE_CHANCE } from "@/lib/tangpt-config";

type Message = { id: string; from: "me" | "her"; text: string; status?: "sent" | "seen"; createdAt: string; voice?: boolean };
type Companion = {
  id: string; name: string; personality: string; mode: string; region: string;
  address_self: string; address_other: string; persona_gender: string; welcome_enabled: boolean;
};

const PAGE = 50;
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

type Row = { id: string; role: string; content: string; created_at: string };
const toMessage = (row: Row): Message => ({
  id: row.id, from: row.role === "assistant" ? "her" : "me", text: row.content, status: "seen", createdAt: row.created_at,
});

export function ChatScreen({ companionId }: { companionId: string }) {
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const [companion, setCompanion] = useState<Companion | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const [paywall, setPaywall] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [memoryOpen, setMemoryOpen] = useState(false);
  const [callOpen, setCallOpen] = useState(false);
  const voice = useCompanionVoice(companionId);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const welcomedRef = useRef(false);

  const speakRef = useRef(voice.speak);
  speakRef.current = voice.speak;

  const showBubbles = useCallback(async (reply: string) => {
    const lines = reply.split("\n").map((line) => line.trim()).filter(Boolean);
    const voiceIndex = Math.random() < VOICE_MESSAGE_CHANCE ? lines.length - 1 : -1;
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index]!;
      const asVoice = index === voiceIndex;
      setTyping(true);
      await wait(typingTime(line));
      setTyping(false);
      const id = crypto.randomUUID();
      setMessages((list) => [...list, { id, from: "her", text: line, createdAt: new Date().toISOString(), voice: asVoice }]);
      if (asVoice) await speakRef.current(line, id).catch(() => undefined);
      await wait(gap());
    }
    setTyping(false);
  }, []);

  useEffect(() => {
    let active = true;
    welcomedRef.current = false;
    (async () => {
      const { data } = await supabase
        .from("companions")
        .select("id, name, personality, mode, region, address_self, address_other, persona_gender, welcome_enabled")
        .eq("id", companionId)
        .maybeSingle();
      if (active && data) setCompanion(data as Companion);
      const { data: rows } = await supabase
        .from("companion_messages")
        .select("id, role, content, created_at")
        .eq("companion_id", companionId)
        .order("created_at", { ascending: false })
        .limit(PAGE);
      if (!active) return;
      const list = ((rows ?? []) as Row[]).slice().reverse().map(toMessage);
      setMessages(list);
      setHasMore((rows ?? []).length === PAGE);
      window.setTimeout(() => endRef.current?.scrollIntoView(), 30);

      if (welcomedRef.current) return;
      welcomedRef.current = true;
      try {
        const result = await companionReply({ data: { companion_id: companionId, mode: "welcome_back" } });
        if (active && result.reply.trim()) await showBubbles(result.reply);
      } catch { /* im lặng, không làm phiền người dùng */ }
    })();
    return () => { active = false; };
  }, [companionId, showBubbles]);

  useEffect(() => { if (!loadingOlder) endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, typing, loadingOlder]);

  async function loadOlder() {
    const thread = threadRef.current;
    const oldest = messages[0];
    if (!thread || !oldest || loadingOlder || !hasMore) return;
    setLoadingOlder(true);
    const before = thread.scrollHeight;
    const { data: rows } = await supabase
      .from("companion_messages")
      .select("id, role, content, created_at")
      .eq("companion_id", companionId)
      .lt("created_at", oldest.createdAt)
      .order("created_at", { ascending: false })
      .limit(PAGE);
    const older = ((rows ?? []) as Row[]).slice().reverse().map(toMessage);
    setHasMore((rows ?? []).length === PAGE);
    if (older.length) {
      setMessages((list) => [...older, ...list]);
      window.setTimeout(() => { thread.scrollTop += thread.scrollHeight - before; }, 0);
    }
    setLoadingOlder(false);
  }

  function onScroll() {
    if ((threadRef.current?.scrollTop ?? 99) < 40) void loadOlder();
  }

  async function savePair(self: string, other: string) {
    if (!companion) return;
    setCompanion({ ...companion, address_self: self, address_other: other });
    setMenuOpen(false);
    await supabase.from("companions").update({ address_self: self, address_other: other }).eq("id", companion.id);
    toast.success(t("Đã đổi cách xưng hô", "Address pair updated"));
  }

  async function toggleWelcome(value: boolean) {
    if (!companion) return;
    setCompanion({ ...companion, welcome_enabled: value });
    await supabase.from("companions").update({ welcome_enabled: value }).eq("id", companion.id);
  }

  async function deleteCompanion() {
    if (!companion) return;
    if (!window.confirm(t("Xóa nhân vật này và toàn bộ dữ liệu?", "Delete this companion and all its data?"))) return;
    await supabase.from("companions").delete().eq("id", companion.id);
    navigate({ to: "/app/ai", replace: true });
  }

  async function send(value: string) {
    const text = value.trim();
    if (!text || typing) return;
    const mine: Message = { id: crypto.randomUUID(), from: "me", text, status: "sent", createdAt: new Date().toISOString() };
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
    await showBubbles(reply);
  }

  const vi = lang === "vi";
  const name = companion?.name ?? t("Nhân vật", "Character");
  const who = personaPronoun(companion?.persona_gender, vi);
  const chips = quickChips(companion?.region ?? "bac", companion?.address_other ?? t("bạn", "you"), vi);

  let lastDay = "";
  return <main className="chat-screen">
    <header className="chat-header">
      <Button asChild variant="ghost" size="icon" aria-label={t("Quay lại", "Back")}><Link to="/app/ai"><ArrowLeft /></Link></Button>
      <div className="avatar-orbit tiny"><span>{name[0]}</span></div>
      <div className="min-w-0"><strong>{name} <i className="ai-chip">AI</i></strong><small>{companion?.personality ?? t("Đang tải", "Loading")} · {t("đang hoạt động", "online")}</small></div>
      <Button variant="ghost" size="icon" aria-label={t("Gọi thoại", "Call")} disabled={!companion} onClick={() => setCallOpen(true)}><Phone /></Button>
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
      <div className="menu-row">
        <span>{t("Lời chào khi quay lại", "Welcome-back greeting")}</span>
        <Switch checked={companion.welcome_enabled !== false} onCheckedChange={(value) => void toggleWelcome(value)} />
      </div>
      <button type="button" className="menu-item" onClick={() => { setMenuOpen(false); setMemoryOpen(true); }}>
        <Brain />{vi ? `${who} nhớ gì về bạn` : "What they remember about you"}
      </button>
      <button type="button" className="menu-item" onClick={() => void deleteCompanion()}>
        <Trash2 />{t("Xóa nhân vật", "Delete companion")}
      </button>
    </div>}
    <div className="chat-thread" ref={threadRef} onScroll={onScroll}>
      {loadingOlder && <div className="thread-loader"><LoaderCircle className="animate-spin" /></div>}
      {messages.length === 0 && !loadingOlder && <>
        <p className="chat-hint">{t("Nhắn một câu để bắt đầu nha. Đây là nhân vật AI, không phải người thật.", "Send a message to begin. This is an AI character, not a real person.")}</p>
        <div className="flex flex-wrap gap-2 justify-center">{chips.map((chip) => <button type="button" key={chip} className="chip" onClick={() => void send(chip)}>{chip}</button>)}</div>
      </>}
      {messages.map((message) => {
        const label = dayLabel(message.createdAt, vi);
        const separator = label !== lastDay ? label : null;
        lastDay = label;
        return <div key={message.id} className={message.from === "me" ? "msg-wrap msg-wrap-me" : "msg-wrap"}>
          {separator && <div className="date-sep"><span>{separator}</span></div>}
          <div className={message.from === "me" ? "msg msg-me" : "msg msg-her"}>
            {message.from === "her" && message.voice
              ? <p className="voice-msg">
                  <button type="button" className="voice-play" aria-label={t("Nghe tin nhắn thoại", "Play voice message")}
                    onClick={() => { if (voice.activeId === message.id) voice.stop(); else void voice.speak(message.text, message.id); }}>
                    {voice.activeId === message.id && voice.status === "loading"
                      ? <LoaderCircle className="animate-spin" size={16} />
                      : voice.activeId === message.id ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                  <span className="voice-wave" aria-hidden>{[9, 15, 22, 13, 18, 10, 20, 12].map((height, index) => <i key={index} style={{ height }} />)}</span>
                  <em>{t("Tin nhắn thoại", "Voice message")}</em>
                </p>
              : <p>{message.text}</p>}
            {message.from === "me" && <small>{message.status === "seen" ? t("Đã xem", "Seen") : t("Đã gửi", "Sent")}</small>}
          </div>
        </div>;
      })}
      {typing && <div className="typing"><i /><i /><i /></div>}
      <div ref={endRef} />
    </div>
    <div className="chat-composer">
      <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void send(draft); }} placeholder={t("Nhắn gì đó...", "Say something...")} />
      <Button variant="gradient" size="icon" onClick={() => void send(draft)} disabled={!draft.trim() || typing} aria-label={t("Gửi", "Send")}><SendHorizontal /></Button>
    </div>
    {memoryOpen && companion && <MemorySheet companionId={companion.id} personaGender={companion.persona_gender}
      onClose={() => setMemoryOpen(false)} onWiped={() => { setMessages([]); setHasMore(false); }} />}
    {callOpen && companion && <CallScreen companion={companion} onClose={() => setCallOpen(false)} />}
    <Paywall open={paywall} onOpenChange={setPaywall} />
  </main>;
}
