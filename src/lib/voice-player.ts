import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { voiceTts } from "./voice.functions";

function base64ToBlob(base64: string, type: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type });
}

function isLateNight() {
  const hour = new Date().getHours();
  return hour >= 22 || hour < 5;
}

export type VoiceStatus = "idle" | "loading" | "playing";

/** Plays companion speech through the server-side Cartesia voice. */
export function useCompanionVoice(companionId: string) {
  const synth = useServerFn(voiceTts);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [muted, setMuted] = useState(false);

  const stop = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
    setActiveId(null);
    setStatus("idle");
  }, []);

  useEffect(() => () => stop(), [stop]);

  const speak = useCallback(
    async (text: string, id: string): Promise<void> => {
      stop();
      if (!text.trim()) return;
      setActiveId(id);
      setStatus("loading");
      try {
        const payload = await synth({
          data: { text, companion_id: companionId, late_night: isLateNight() },
        });
        const url = URL.createObjectURL(base64ToBlob(payload.audio_base64, payload.content_type));
        urlRef.current = url;
        const audio = new Audio(url);
        audio.muted = muted;
        audioRef.current = audio;
        setStatus("playing");
        await new Promise<void>((resolve) => {
          audio.onended = () => resolve();
          audio.onerror = () => resolve();
          void audio.play().catch(() => resolve());
        });
      } finally {
        if (audioRef.current) {
          audioRef.current = null;
          if (urlRef.current) URL.revokeObjectURL(urlRef.current);
          urlRef.current = null;
        }
        setActiveId(null);
        setStatus("idle");
      }
    },
    [companionId, muted, stop, synth],
  );

  const toggleMuted = useCallback(() => {
    setMuted((value) => {
      const next = !value;
      if (audioRef.current) audioRef.current.muted = next;
      return next;
    });
  }, []);

  return { speak, stop, activeId, status, muted, toggleMuted };
}
