import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Copy, Mic, PhoneOff, SendHorizontal, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "./Language";
import { useCompanionVoice } from "@/lib/voice-player";
import { companionReply } from "@/lib/companion.functions";
import { logDebug, useOverlayFlag } from "@/lib/debug-bus";
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

const CONSENT_KEY = "tangpt-voice-consent";
const IN_APP = /FBAN|FBAV|FB_IAB|Instagram|Messenger|Zalo|Line\/|TikTok|musical_ly/i;

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

/** Returns true when the browser cannot give us the microphone at all. */
function micBlocked(): boolean {
  if (typeof window === "undefined") return true;
  const nav = window.navigator;
  if (IN_APP.test(nav.userAgent)) return true;
  if (!nav.mediaDevices?.getUserMedia) return true;
  if (!window.isSecureContext) return true;
  return false;
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
  const [ttsIssue, setTtsIssue] = useState(false);
  const [micIssue, setMicIssue] = useState(false);
  const [needConsent, setNeedConsent] = useState(false);
  const recognitionRef = useRef<Recognition | null>(null);
  const aliveRef = useRef(true);
  const startedRef = useRef(false);
  const poppedRef = useRef(false);

  useOverlayFlag("call-screen", true);

  // Browser/hardware back ends the call instead of leaving the chat.
  useEffect(() => {
    if (!window.history.state?.tangptCall) window.history.pushState({ tangptCall: true }, "");
    const onPop = () => { poppedRef.current = true; onClose(); };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [onClose]);

  /** Hang up through history so the call entry is removed cleanly. */
  const hangUp = useCallback(() => {
    if (window.history.state?.tangptCall) window.history.back();
    else onClose();
  }, [onClose]);

  // Voice never blocks the screen: any failure only sets a message.
  const say = useCallback(async (text: string) => {
    if (!text.trim()) return;
    setCaption(text.split("\n").join(" "));
    try {
      await speak(text, "call");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logDebug("error", `call tts failed: ${message}`);
      if (aliveRef.current) setTtsIssue(true);
    }
  }, [speak]);

  const ask = useCallback(async (message: string) => {
    setThinking(true);
    try {
      const result = await companionReply({ data: { companion_id: companion.id, message } });
      if (!aliveRef.current) return;
      await say(result.reply);
    } catch (error) {
      const raw = error instanceof Error ? error.message : String(error);
      logDebug("error", `call reply failed: ${raw}`);
      if (raw.includes("limit_reached")) toast.error(t("Hết lượt trò chuyện hôm nay rồi.", "You are out of messages for today."));
      else toast.error(t("Cuộc gọi bị gián đoạn, thử lại nha.", "The call glitched, please try again."));
    } finally {
      if (aliveRef.current) setThinking(false);
    }
  }, [companion.id, say, t]);

  useEffect(() => {
    aliveRef.current = true;
    if (typeof window !== "undefined" && window.localStorage.getItem(CONSENT_KEY) !== "1") setNeedConsent(true);
    if (micBlocked()) { setMicIssue(true); logDebug("info", "microphone unavailable in this browser"); }
    if (startedRef.current) return;
    startedRef.current = true;
    (async () => {
      await new Promise((resolve) => setTimeout(resolve, 600));
      if (!aliveRef.current) return;
      setPhase("live");
      let opener = t("Alo, nghe rõ không?", "Hey, can you hear me?");
      try {
        const result = await companionReply({ data: { companion_id: companion.id, mode: "welcome_back" } });
        if (result.reply.trim()) opener = result.reply.trim();
      } catch (error) {
        logDebug("error", `call greeting failed: ${error instanceof Error ? error.message : String(error)}`);
      }
      if (aliveRef.current) await say(opener);
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

  function acceptConsent() {
    window.localStorage.setItem(CONSENT_KEY, "1");
    setNeedConsent(false);
  }

  async function toggleListening() {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    if (micBlocked()) { setMicIssue(true); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
    } catch (error) {
      logDebug("error", `microphone denied: ${error instanceof Error ? error.message : String(error)}`);
      setMicIssue(true);
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

  function copyLink() {
    void navigator.clipboard?.writeText(window.location.href).then(
      () => toast.success(t("Đã sao chép link", "Link copied")),
      () => toast.error(t("Không sao chép được", "Could not copy")),
    );
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

  const screen = <div className="call-screen" role="dialog" aria-modal="true">
    <div className="call-body">
      <div className={status === "playing" ? "call-avatar call-avatar-live" : "call-avatar"}><span>{companion.name[0]}</span></div>
      <h2>{companion.name} <i className="ai-chip">AI</i></h2>
      <p className="call-state">{state}</p>
      {caption && <p className="call-caption">{caption}</p>}
      {ttsIssue && !micIssue && <div className="call-notice">
        <p>{t("Chưa bật được giọng nói. Thử lại hoặc nhắn tin nhé.", "Voice could not start. Try again or send a message.")}</p>
        <Button variant="outline" size="sm" onClick={hangUp}>{t("Nhắn tin", "Send a message")}</Button>
      </div>}
      {micIssue && <div className="call-notice">
        <p>{t("Trình duyệt này chặn micro. Hãy mở link bằng Safari hoặc Chrome.", "This browser blocks the microphone. Open the link in Safari or Chrome.")}</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copyLink}><Copy />{t("Sao chép link", "Copy link")}</Button>
          <Button variant="outline" size="sm" onClick={hangUp}>{t("Nhắn tin", "Send a message")}</Button>
        </div>
      </div>}
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
      <button type="button" className={listening ? "call-btn call-btn-on" : "call-btn"} onClick={() => void toggleListening()} aria-label={t("Nói", "Talk")}>
        <Mic />
        <small>{listening ? t("Đang nghe", "Listening") : t("Nói", "Talk")}</small>
      </button>
      <button type="button" className="call-btn call-btn-end" onClick={hangUp} aria-label={t("Kết thúc", "Hang up")}>
        <PhoneOff />
        <small>{t("Kết thúc", "Hang up")}</small>
      </button>
    </div>
    {needConsent && <div className="call-consent">
      <div className="call-consent-card">
        <h3>{t("Cho phép dùng giọng nói?", "Allow voice?")}</h3>
        <p>{t("Cuộc gọi sẽ phát giọng AI và có thể dùng micro của bạn khi bạn bấm Nói.", "The call plays an AI voice and may use your microphone when you tap Talk.")}</p>
        <div className="flex gap-2">
          <Button variant="gradient" size="sm" onClick={acceptConsent}>{t("Đồng ý", "Allow")}</Button>
          <Button variant="outline" size="sm" onClick={() => setNeedConsent(false)}>{t("Chỉ nhắn tin", "Text only")}</Button>
        </div>
      </div>
    </div>}
  </div>;

  if (typeof document === "undefined") return screen;
  return createPortal(screen, document.body);
}
