import { useState } from "react";
import { Lightbulb, LoaderCircle, RefreshCw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatBubble } from "./ChatBubble";
import { Paywall } from "./Paywall";
import { useRegionTheme } from "./RegionTheme";
import { useLang } from "./Language";
import { regions, type AgeGroup } from "@/lib/tangpt-data";

export type Generation = { id: string; input: string; createdAt: string; options: { style: string; text: string; why: string }[]; tip: string };

const sample = {
  options: [
    { style: "Vui vẻ", text: "Mệt dữ vậy hả. Cho mình ship qua một phần năng lượng tích cực được không nè?", why: "Nhẹ nhàng, có chút trêu và mở được đường cho em ấy kể thêm." },
    { style: "Chân thành", text: "Nghe thương quá. Em nghỉ ngơi chút đi nha, hôm nay có chuyện gì làm em mệt vậy?", why: "Thể hiện quan tâm thật lòng mà không vồ vập." },
    { style: "Tự tin", text: "Tối nay cứ nghỉ cho khỏe. Cuối tuần để mình bù cho em một buổi thật vui nhé.", why: "Chủ động vừa đủ, có lời mời rõ ràng nhưng vẫn tôn trọng." },
  ],
  tip: "Hỏi một câu thôi rồi chờ em ấy trả lời. Quan tâm không có nghĩa là phỏng vấn nha.",
};

export function SuggestTab() {
  const { region, city, setCity } = useRegionTheme();
  const { t } = useLang();
  const [mode, setMode] = useState<"reply" | "opener">("reply");
  const [age, setAge] = useState<AgeGroup>("18-26");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<typeof sample | null>(null);
  const [copied, setCopied] = useState("");
  const [paywall, setPaywall] = useState(false);

  async function generate() {
    if (!text.trim()) return;
    if (text.trim().toLowerCase() === "limit_reached") { setPaywall(true); return; }
    setLoading(true); setResult(null);
    await new Promise((r) => setTimeout(r, 1500));
    setResult(sample); setLoading(false);
    const entry: Generation = { id: crypto.randomUUID(), input: text, createdAt: new Date().toISOString(), ...sample };
    const all = JSON.parse(window.localStorage.getItem("tangpt-history") || "[]") as Generation[];
    window.localStorage.setItem("tangpt-history", JSON.stringify([entry, ...all].slice(0, 20)));
  }
  async function copy(value: string, style: string) { await navigator.clipboard.writeText(value); setCopied(style); window.setTimeout(() => setCopied(""), 2000); }

  return <section className="tab-page">
    <div className="page-title"><span>{t("LỜI HAY ĐÚNG LÚC", "THE RIGHT WORDS")}</span><h1>{t("Gợi ý cho bạn", "Ideas for you")}</h1></div>
    <div className="segmented"><button type="button" className={mode === "reply" ? "active" : ""} onClick={() => setMode("reply")}>{t("Trả lời tin nhắn", "Reply to a message")}</button><button type="button" className={mode === "opener" ? "active" : ""} onClick={() => setMode("opener")}>{t("Mở lời", "Opener")}</button></div>
    <div className="filter-block">
      <label>{t("Thành phố", "City")}</label>
      <div className="chip-scroll">{regions[region].cities.map((value) => <button type="button" className={city === value ? "chip chip-active" : "chip"} onClick={() => setCity(value)} key={value}>{value}</button>)}</div>
      <label>{t("Độ tuổi", "Age group")}</label>
      <div className="flex gap-2">{(["18-26", "27-35", "36+"] as AgeGroup[]).map((value) => <button type="button" className={age === value ? "chip chip-active" : "chip"} onClick={() => setAge(value)} key={value}>{value}</button>)}</div>
    </div>
    <div className="composer-card"><textarea value={text} maxLength={800} onChange={(e) => setText(e.target.value)} placeholder={mode === "reply" ? t("Dán tin nhắn của em ấy vào đây...", "Paste her message here...") : t("Mô tả profile, bio hoặc ảnh của em ấy...", "Describe her profile, bio or photo...")} /><span>{text.length}/800</span></div>
    <Button variant="gradient" size="lg" onClick={generate} disabled={loading || !text.trim()}>{loading ? <><LoaderCircle className="animate-spin" />{t("Đang nghĩ câu duyên...", "Thinking of something charming...")}</> : <><Send />{t("Gợi ý cho tôi", "Give me ideas")}</>}</Button>
    {result && <div className="results fade-up">
      <div className="result-heading"><div><span>{t("3 CÁCH TRẢ LỜI", "3 WAYS TO REPLY")}</span><h2>{t("Chọn câu hợp bạn nhất", "Pick the one that feels like you")}</h2></div><Button variant="ghost" size="sm" onClick={generate}><RefreshCw />{t("Tạo lại", "Regenerate")}</Button></div>
      {result.options.map((option) => <article key={option.style}><h3>{option.style}</h3><ChatBubble text={option.text} why={option.why} copied={copied === option.style} onCopy={() => copy(option.text, option.style)} /></article>)}
      <aside className="tip-box"><Lightbulb /><div><b>{t("Mẹo nhỏ", "Quick tip")}</b><p>{result.tip}</p></div></aside>
    </div>}
    <Paywall open={paywall} onOpenChange={setPaywall} />
  </section>;
}
