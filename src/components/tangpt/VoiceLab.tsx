import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Loader2, Eye, Star } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { useLang } from "./Language";
import { supabase } from "@/integrations/supabase/client";
import { voiceTts } from "@/lib/voice.functions";

const TEST_LINE = "Ok nha, mai em có deadline nên hơi busy, but em vẫn nhắn cho anh nè.";
const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];

const REGIONS = [
  { value: "north", vi: "Miền Bắc", en: "North" },
  { value: "south", vi: "Miền Nam", en: "South" },
  { value: "central", vi: "Miền Trung", en: "Central" },
  { value: "mekong", vi: "Miền Tây", en: "Mekong" },
] as const;

const GENDERS = [
  { value: "female", vi: "Nữ", en: "Female" },
  { value: "male", vi: "Nam", en: "Male" },
  { value: "nonbinary", vi: "Phi nhị giới", en: "Non-binary" },
] as const;

type Profile = { id: string; label: string; provider: string; voice_id: string; style_prompt: string };
type Scores = { natural: number; accent: number; keep_listening: number };

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

export function VoiceLab() {
  const { t } = useLang();
  const synthesize = useServerFn(voiceTts);
  const [text, setText] = useState(TEST_LINE);
  const [region, setRegion] = useState<string>("south");
  const [gender, setGender] = useState<string>("female");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [latency, setLatency] = useState<Record<string, number>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [scores, setScores] = useState<Record<string, Scores>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      for (let attempt = 0; attempt < 20; attempt += 1) {
        const { data: session } = await supabase.auth.getSession();
        if (session.session) break;
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
      if (cancelled) return;
      const { data } = await supabase
        .from("voice_profiles")
        .select("id, label, provider, voice_id, style_prompt")
        .eq("active", true)
        .eq("region", region)
        .eq("persona_gender", gender)
        .in("provider", ACTIVE_VOICE_PROVIDERS);
      if (cancelled) return;
      setProfiles(shuffle((data ?? []) as Profile[]));
      setRevealed({});
      setLatency({});
      setErrors({});
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [region, gender]);

  const placeholders = useMemo(
    () => profiles.filter((p) => p.voice_id === "REPLACE_WITH_VOICE_ID").length,
    [profiles],
  );

  async function play(profile: Profile) {
    setBusy(profile.id);
    setErrors((prev) => ({ ...prev, [profile.id]: "" }));
    const started = performance.now();
    try {
      const result = await synthesize({ data: { text, profile_id: profile.id, region: region as never, persona_gender: gender as never } });
      setLatency((prev) => ({ ...prev, [profile.id]: Math.round(performance.now() - started) }));
      audioRef.current?.pause();
      const audio = new Audio(`data:${result.content_type};base64,${result.audio_base64}`);
      audioRef.current = audio;
      await audio.play();
    } catch (error) {
      const code = error instanceof Error ? error.message : "provider_failed";
      const message = code.includes("missing_key")
        ? t("Thiếu API key cho nhà cung cấp này.", "API key missing for this provider.")
        : code.includes("bad_voice_id")
          ? t("Voice ID vẫn là placeholder.", "Voice ID is still a placeholder.")
          : t("Không tạo được audio.", "Could not generate audio.");
      setErrors((prev) => ({ ...prev, [profile.id]: message }));
    } finally {
      setBusy("");
    }
  }

  function setScore(id: string, field: keyof Scores, value: number) {
    setScores((prev) => ({ ...prev, [id]: { natural: 0, accent: 0, keep_listening: 0, ...prev[id], [field]: value } }));
    setSaved((prev) => ({ ...prev, [id]: false }));
  }

  async function saveRating(id: string) {
    const score = scores[id];
    if (!score || !score.natural || !score.accent || !score.keep_listening) return;
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) return;
    await supabase.from("voice_ratings").insert({
      profile_id: id,
      user_id: userId,
      natural: score.natural,
      accent: score.accent,
      keep_listening: score.keep_listening,
    });
    setSaved((prev) => ({ ...prev, [id]: true }));
  }

  return (
    <div className="tab-page">
      <div className="page-title">
        <span>{t("THỬ MÙ", "BLIND TEST")}</span>
        <h1>{t("Phòng thử giọng", "Voice lab")}</h1>
        <p>{t("Nghe từng giọng, chấm điểm rồi mới xem nhà cung cấp.", "Listen, rate, then reveal the provider.")}</p>
      </div>

      <div className="composer-card">
        <textarea value={text} onChange={(event) => setText(event.target.value)} rows={3} />
      </div>

      <div className="filter-block">
        <label>{t("Vùng miền", "Region")}</label>
        <div className="chip-scroll flex gap-2">
          {REGIONS.map((item) => (
            <button key={item.value} type="button" className={`chip ${region === item.value ? "chip-on" : ""}`} onClick={() => setRegion(item.value)}>
              {t(item.vi, item.en)}
            </button>
          ))}
        </div>
        <label>{t("Giới tính giọng", "Voice gender")}</label>
        <div className="chip-scroll flex gap-2">
          {GENDERS.map((item) => (
            <button key={item.value} type="button" className={`chip ${gender === item.value ? "chip-on" : ""}`} onClick={() => setGender(item.value)}>
              {t(item.vi, item.en)}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="empty-note">{t("Đang tải giọng…", "Loading voices…")}</p>}
      {!loading && profiles.length === 0 && (
        <p className="empty-note">{t("Chưa có giọng nào cho lựa chọn này.", "No voices for this combination yet.")}</p>
      )}
      {!loading && placeholders > 0 && (
        <p className="empty-note">
          {t(`${placeholders} giọng vẫn là PLACEHOLDER.`, `${placeholders} voices still hold PLACEHOLDER ids.`)}
        </p>
      )}

      <div className="results">
        {profiles.map((profile, index) => {
          const score = scores[profile.id];
          return (
            <article key={profile.id}>
              <header className="flex items-center justify-between gap-3">
                <strong>{LETTERS[index] ?? String(index + 1)}</strong>
                <div className="flex items-center gap-2">
                  {latency[profile.id] !== undefined && <small>{latency[profile.id]} ms</small>}
                  <Button size="sm" variant="secondary" onClick={() => play(profile)} disabled={busy === profile.id}>
                    {busy === profile.id ? <Loader2 className="animate-spin" /> : <Play />}
                    {t("Nghe", "Play")}
                  </Button>
                </div>
              </header>

              {errors[profile.id] && <p className="empty-note">{errors[profile.id]}</p>}

              {([
                ["natural", t("Tự nhiên", "Natural")],
                ["accent", t("Đúng giọng vùng", "Right regional accent")],
                ["keep_listening", t("Muốn nghe tiếp", "Want to keep listening")],
              ] as const).map(([field, label]) => (
                <div key={field} className="flex items-center justify-between gap-2">
                  <small>{label}</small>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        aria-label={`${label} ${value}`}
                        onClick={() => setScore(profile.id, field, value)}
                        className="star-btn"
                      >
                        <Star fill={(score?.[field] ?? 0) >= value ? "currentColor" : "none"} size={18} />
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between gap-2">
                <Button size="sm" variant="ghost" onClick={() => setRevealed((prev) => ({ ...prev, [profile.id]: true }))}>
                  <Eye />{t("Lộ diện", "Reveal")}
                </Button>
                <Button size="sm" onClick={() => saveRating(profile.id)} disabled={saved[profile.id]}>
                  {saved[profile.id] ? t("Đã lưu", "Saved") : t("Lưu điểm", "Save rating")}
                </Button>
              </div>

              {revealed[profile.id] && (
                <p className="empty-note">{profile.provider} — {profile.label} ({profile.voice_id})</p>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
