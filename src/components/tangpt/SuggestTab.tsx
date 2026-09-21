import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Lightbulb, LoaderCircle, RefreshCw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatBubble } from "./ChatBubble";
import { Paywall } from "./Paywall";
import { useRegionTheme } from "./RegionTheme";
import { useLang } from "./Language";
import { regions, type AgeGroup, type RegionKey } from "@/lib/tangpt-data";
import { generateRizz, type RizzPayload, type RizzRegion } from "@/lib/rizz.functions";
import { readReplyLanguage, saveReplyLanguage, useProfile } from "@/lib/tangpt-profile";

type ReplyLanguage = "vi" | "en" | "mix";

const regionKeys: RegionKey[] = ["bac", "nam", "trung", "tay"];
const ageGroups: AgeGroup[] = ["18-26", "27-35", "36+"];
const regionApi: Record<RegionKey, RizzRegion> = { bac: "north", nam: "south", trung: "central", tay: "mekong" };

export function SuggestTab() {
  const { region, setRegion, city, setCity } = useRegionTheme();
  const { t, lang } = useLang();
  const profile = useProfile();
  const askRizz = useServerFn(generateRizz);
  const [mode, setMode] = useState<"reply" | "opener">("reply");
  const [age, setAge] = useState<AgeGroup>("18-26");
  const [replyLanguage, setReplyLanguage] = useState<ReplyLanguage>("vi");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RizzPayload | null>(null);
  const [copied, setCopied] = useState("");
  const [paywall, setPaywall] = useState(false);

  useEffect(() => {
    const saved = readReplyLanguage();
    setReplyLanguage(saved === "both" ? "mix" : saved);
  }, []);
  useEffect(() => {
    if (!profile) return;
    if (profile.region) setRegion(profile.region);
    if (profile.city) setCity(profile.city);
    if (profile.ageGroup) setAge(profile.ageGroup);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  function pickLanguage(value: ReplyLanguage) {
    setReplyLanguage(value);
    saveReplyLanguage(value === "mix" ? "both" : value);
  }

  async function generate() {
    if (!text.trim() || loading) return;
    setLoading(true);
    setResult(null);
    try {
      const payload = await askRizz({
        data: {
          mode,
          region: regionApi[region],
          city,
          age_group: age,
          input_text: text.trim(),
          ui_language: lang === "en" ? "en" : "vi",
          reply_language: replyLanguage,
        },
      });
      setResult(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("limit_reached")) setPaywall(true);
      else if (message.includes("missing_key"))
        toast.error(t("Chưa kết nối AI. Cần thêm khóa AI trong phần cài đặt dự án.", "AI is not connected yet. The AI key still needs to be saved."));
      else if (message.includes("bad_ai_response"))
        toast.error(t("AI trả lời hơi lạ, bạn thử lại giúp mình nha.", "The AI reply came back malformed, please try again."));
      else toast.error(t("Chưa gợi ý được lúc này. Thử lại sau chút nha.", "Couldn't generate right now. Please try again shortly."));
    } finally {
      setLoading(false);
    }
  }

  async function copy(value: string, style: string) {
    await navigator.clipboard.writeText(value);
    setCopied(style);
    window.setTimeout(() => setCopied(""), 2000);
  }

  return <section className="tab-page">
    <div className="page-title"><span>{t("LỜI HAY ĐÚNG LÚC", "THE RIGHT WORDS")}</span><h1>{t("Gợi ý cho bạn", "Ideas for you")}</h1></div>
    <div className="segmented">
      <button type="button" className={mode === "reply" ? "active" : ""} onClick={() => setMode("reply")}>{t("Trả lời tin nhắn", "Reply to a message")}</button>
      <button type="button" className={mode === "opener" ? "active" : ""} onClick={() => setMode("opener")}>{t("Mở lời", "Opener")}</button>
    </div>
    <div className="filter-block">
      <label>{t("Vùng miền", "Region")}</label>
      <div className="chip-scroll">{regionKeys.map((key) => <button type="button" key={key} className={region === key ? "chip chip-active" : "chip"} onClick={() => { setRegion(key); setCity(regions[key].city); }}>{regions[key].name}</button>)}</div>
      <label>{t("Thành phố", "City")}</label>
      <div className="chip-scroll">{regions[region].cities.map((value) => <button type="button" className={city === value ? "chip chip-active" : "chip"} onClick={() => setCity(value)} key={value}>{value}</button>)}</div>
      <label>{t("Độ tuổi của em ấy", "Her age group")}</label>
      <div className="flex gap-2">{ageGroups.map((value) => <button type="button" className={age === value ? "chip chip-active" : "chip"} onClick={() => setAge(value)} key={value}>{value}</button>)}</div>
      <label>{t("Ngôn ngữ câu trả lời", "Reply language")}</label>
      <div className="flex flex-wrap gap-2">
        {([["vi", "Tiếng Việt"], ["en", "English"], ["mix", t("Song ngữ", "Bilingual")]] as [ReplyLanguage, string][]).map(([value, label]) =>
          <button type="button" key={value} className={replyLanguage === value ? "chip chip-active" : "chip"} onClick={() => pickLanguage(value)}>{label}</button>)}
      </div>
    </div>
    <div className="composer-card">
      <textarea value={text} maxLength={800} onChange={(e) => setText(e.target.value)} placeholder={mode === "reply" ? t("Dán tin nhắn của em ấy vào đây...", "Paste her message here...") : t("Mô tả profile, bio hoặc ảnh của em ấy...", "Describe her profile, bio or photo...")} />
      <span>{text.length}/800</span>
    </div>
    <Button variant="gradient" size="lg" onClick={generate} disabled={loading || !text.trim()}>
      {loading ? <><LoaderCircle className="animate-spin" />{t("Đang nghĩ câu duyên...", "Thinking of something charming...")}</> : <><Send />{t("Gợi ý cho tôi", "Give me ideas")}</>}
    </Button>
    {result && <div className="results fade-up">
      <div className="result-heading">
        <div><span>{t("3 CÁCH TRẢ LỜI", "3 WAYS TO REPLY")}</span><h2>{t("Chọn câu hợp bạn nhất", "Pick the one that feels like you")}</h2></div>
        <Button variant="ghost" size="sm" onClick={generate}><RefreshCw />{t("Tạo lại", "Regenerate")}</Button>
      </div>
      {result.options.map((option) => <article key={option.style}><h3>{option.style}</h3><ChatBubble text={option.text} why={option.why} copied={copied === option.style} onCopy={() => copy(option.text, option.style)} /></article>)}
      {result.tip && <aside className="tip-box"><Lightbulb /><div><b>{t("Mẹo nhỏ", "Quick tip")}</b><p>{result.tip}</p></div></aside>}
    </div>}
    <Paywall open={paywall} onOpenChange={setPaywall} />
  </section>;
}
