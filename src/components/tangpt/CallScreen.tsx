import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, PhoneOff, SendHorizontal, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "./Language";
import { useCompanionVoice } from "@/lib/voice-player";
import { companionReply } from "@/lib/companion.functions";
import { toast } from "sonner";

type Companion = { id: string; name: string; persona_gender: string; personality: string };

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

function createRecognition(lang: string): Recognition | null {
  if (typeof window === "undefined") return null;
  const holder = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  const Ctor = holder.SpeechRecognition ?? holder.webkitSpeechRecognition;
  if (!Ctor) return null;
  const recognition = new Ctor();
  recognition.lang = lang;
  recognition.continuous = false;
  recognition.interimResults = false;
  return recognition;
}

function clock(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function CallScreen({ companion, onClose }: { companion: Companion; onClose: () => void }) {
  const { t, lang } = useLang();
  const vi = lang === "vi";
  const { speak, stop, status, muted, toggleMuted } = useCompanionVoice(companion.id);
  const [phase, setPhase] = useState<"connecting" | "live">("connecting");
  const [seconds, setSeconds] = useState(0);
  const [caption, setCaption] = useState("");
  const [listening, setListening] = useState(false);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const recognitionRef = useRef<Recognition | null>(null);
  const aliveRef = useRef(true);
  const startedRef = useRef(false);

  const say = useCallback(async (text: string) => {
    if (!text.trim()) return;
    setCaption(text.split("\n").join(" "));
    await speak(text, "call");
  }, [speak]);

  const ask = useCallback(async (message: string) => {
    setThinking(true);
    try {
      const result = await companionReply({ data: { companion_id: companion.id, message } });
      if (!aliveRef.current) return;
      await say(result.reply);
    } catch (error) {
      const raw = error instanceof Error ? error.message : String(error);
      if (raw.includes("limit_reached")) toast.error(t("Hết lượt trò chuyện hôm nay rồi.", "You are out of messages for today."));
      else toast.error(t("Cuộc gọi bị gián đoạn, thử lại nha.", "The call glitched, please try again."));
    } finally {
      if (aliveRef.current) setThinking(false);
    }
  }, [companion.id, say, t]);

  useEffect(() => {
    aliveRef.current = true;
    if (startedRef.current) return;
    startedRef.current = true;
    (async () => {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      if (!aliveRef.current) return;
      setPhase("live");
      try {
        const result = await companionReply({ data: { companion_id: companion.id, mode: "welcome_back" } });
        const opener = result.reply.trim() || t("Alo, nghe rõ không?", "Hey, can you hear me?");
        if (aliveRef.current) await say(opener);
      } catch {
        if (aliveRef.current) await say(t("Alo, nghe rõ không?", "Hey, can you hear me?"));
      }
    })();
    return () => {
      aliveRef.current = false;
      recognitionRef.current?.stop();
      stop();
    };
  }, [companion.id, say, stop, t]);

  useEffect(() => {
    if (phase !== "live") return;
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [phase]);

  function toggleListening() {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const recognition = createRecognition(vi ? "vi-VN" : "en-US");
    if (!recognition) {
      toast.info(t("Máy này chưa hỗ trợ nói, bạn gõ tin nhắn nha.", "Speech input is not supported here, type instead."));
      return;
    }
    recognitionRef.current = recognition;
    recognition.onresult = (event) => {
      const text = event.results[0]?.[0]?.transcript ?? "";
      setListening(false);
      if (text.trim()) void ask(text.trim());
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognition.start();
    setListening(true);
  }

  function sendDraft() {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    void ask(text);
  }

  const state = phase === "connecting"
    ? t("Đang kết nối...", "Connecting...")
    : thinking
      ? t("Đang nghĩ...", "Thinking...")
      : status === "loading"
        ? t("Đang chuẩn bị giọng...", "Preparing voice...")
        : status === "playing"
          ? t("Đang nói...", "Speaking...")
          : listening
            ? t("Đang nghe bạn...", "Listening...")
            : clock(seconds);

  return <div className="call-screen">
    <div className="call-body">
      <div className={status === "playing" ? "call-avatar call-avatar-live" : "call-avatar"}><span>{companion.name[0]}</span></div>
      <h2>{companion.name} <i className="ai-chip">AI</i></h2>
      <p className="call-state">{state}</p>
      {caption && <p className="call-caption">{caption}</p>}
    </div>
    <div className="call-input">
      <input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => { if (event.key === "Enter") sendDraft(); }}
        placeholder={t("Gõ nếu không tiện nói...", "Type if you cannot talk...")}
      />
      <Button variant="ghost" size="icon" onClick={sendDraft} disabled={!draft.trim()} aria-label={t("Gửi", "Send")}><SendHorizontal /></Button>
    </div>
    <div className="call-actions">
      <button type="button" className={muted ? "call-btn call-btn-on" : "call-btn"} onClick={toggleMuted} aria-label={t("Tắt tiếng", "Mute")}>
        {muted ? <VolumeX /> : <Volume2 />}
        <small>{muted ? t("Bật tiếng", "Unmute") : t("Tắt tiếng", "Mute")}</small>
      </button>
      <button type="button" className={listening ? "call-btn call-btn-on" : "call-btn"} onClick={toggleListening} aria-label={t("Nói", "Talk")}>
        <Mic />
        <small>{listening ? t("Đang nghe", "Listening") : t("Nói", "Talk")}</small>
      </button>
      <button type="button" className="call-btn call-btn-end" onClick={onClose} aria-label={t("Kết thúc", "Hang up")}>
        <PhoneOff />
        <small>{t("Kết thúc", "Hang up")}</small>
      </button>
    </div>
  </div>;
}
