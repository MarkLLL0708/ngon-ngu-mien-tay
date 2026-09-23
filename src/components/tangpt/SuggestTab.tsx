import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ImagePlus, Lightbulb, LoaderCircle, RefreshCw, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatBubble } from "./ChatBubble";
import { Paywall } from "./Paywall";
import { RegionChipBar } from "./RegionChipBar";
import { useRegionTheme } from "./RegionTheme";
import { useLang } from "./Language";
import { regions, type AgeGroup, type RegionKey } from "@/lib/tangpt-data";
import { ACCEPTED_IMAGE_TYPES, imageErrorText, prepareImage } from "@/lib/tangpt-image";
import { generateRizz, type RizzPayload, type RizzRegion } from "@/lib/rizz.functions";
import { readReplyLanguage, saveReplyLanguage, useProfile, type UserGender } from "@/lib/tangpt-profile";
import { defaultAddress } from "@/lib/tangpt-gender";

import type { RizzRelativeAge, RizzTargetGender } from "@/lib/rizz.functions";

type ReplyLanguage = "vi" | "en" | "mix";

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
  const [userGender, setUserGender] = useState<UserGender>("unspecified");
  const [targetGender, setTargetGender] = useState<RizzTargetGender>("female");
  const [relativeAge, setRelativeAge] = useState<RizzRelativeAge>("similar");
  const [addressSelf, setAddressSelf] = useState("mình");
  const [addressOther, setAddressOther] = useState("bạn");
  const [photo, setPhoto] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = readReplyLanguage();
    setReplyLanguage(saved === "both" ? "mix" : saved);
    const self = window.localStorage.getItem("tangpt-address-self");
    const other = window.localStorage.getItem("tangpt-address-other");
    if (self) setAddressSelf(self);
    if (other) setAddressOther(other);
  }, []);
  // The combined choice from onboarding / Me prefills both the target chip and the pronouns.
  useEffect(() => {
    if (!profile) return;
    if (profile.region) setRegion(profile.region);
    if (profile.city) setCity(profile.city);
    if (profile.ageGroup) setAge(profile.ageGroup);
    setUserGender(profile.gender);
    if (profile.targetGender !== "unspecified") setTargetGender(profile.targetGender as RizzTargetGender);
    const savedSelf = window.localStorage.getItem("tangpt-address-self");
    if (!savedSelf) {
      const [self, other] = defaultAddress(profile.gender, profile.targetGender);
      setAddressSelf(self);
      setAddressOther(other);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);



  function pickLanguage(value: ReplyLanguage) {
    setReplyLanguage(value);
    saveReplyLanguage(value === "mix" ? "both" : value);
  }

  async function pickPhoto(file: File | undefined) {
    if (!file) return;
    try {
      const prepared = await prepareImage(file);
      setPhoto(prepared.dataUrl);
    } catch (error) {
      toast.error(imageErrorText(error, lang !== "en"));
    }
  }

  async function generate() {
    if ((!text.trim() && !(mode === "opener" && photo)) || loading) return;
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
          user_gender: userGender,
          target_gender: targetGender,
          relative_age: relativeAge,
          address_self: addressSelf.trim().slice(0, 12) || "mình",
          address_other: addressOther.trim().slice(0, 12) || "bạn",
          ...(mode === "opener" && photo ? { image_data: photo } : {}),
        },
      });
      setResult(payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("limit_reached")) setPaywall(true);
      else if (message.includes("credits"))
        toast.error(t("Hết lượt AI của dự án rồi. Nạp thêm trong phần Plans & credits nha.", "The project's AI credits ran out. Top up in Plans & credits."));
      else if (message.includes("rate_limited"))
        toast.error(t("AI đang bận, chờ vài giây rồi thử lại nha.", "The AI is busy, give it a few seconds and try again."));
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
    <RegionChipBar />
    <div className="segmented">
      <button type="button" className={mode === "reply" ? "active" : ""} onClick={() => setMode("reply")}>{t("Trả lời tin nhắn", "Reply to a message")}</button>
      <button type="button" className={mode === "opener" ? "active" : ""} onClick={() => setMode("opener")}>{t("Mở lời", "Opener")}</button>
    </div>
    <div className="filter-block">
      <label>{t("Thành phố", "City")}</label>
      <div className="chip-scroll">{regions[region].cities.map((value) => <button type="button" className={city === value ? "chip chip-active" : "chip"} onClick={() => setCity(value)} key={value}>{value}</button>)}</div>
      <label>{t("Độ tuổi của người ấy", "Their age group")}</label>
      <div className="flex gap-2">{ageGroups.map((value) => <button type="button" className={age === value ? "chip chip-active" : "chip"} onClick={() => setAge(value)} key={value}>{value}</button>)}</div>
      {/* "Bạn là" giờ nằm trong lựa chọn ghép ở onboarding và trang Tôi. */}

      <label>{t("Người ấy là", "They are")}</label>
      <div className="flex flex-wrap gap-2">
        {([["female", t("Nữ", "Woman")], ["male", t("Nam", "Man")], ["nonbinary", t("Phi nhị giới", "Non-binary")]] as [RizzTargetGender, string][]).map(([value, label]) =>
          <button type="button" key={value} className={targetGender === value ? "chip chip-active" : "chip"} onClick={() => setTargetGender(value)}>{label}</button>)}
      </div>
      <label>{t("Tuổi so với bạn", "Age vs. you")}</label>
      <div className="flex flex-wrap gap-2">
        {([["older", t("Lớn tuổi hơn", "Older")], ["similar", t("Bằng tuổi", "Similar")], ["younger", t("Nhỏ tuổi hơn", "Younger")]] as [RizzRelativeAge, string][]).map(([value, label]) =>
          <button type="button" key={value} className={relativeAge === value ? "chip chip-active" : "chip"} onClick={() => setRelativeAge(value)}>{label}</button>)}
      </div>
      <label>{t("Xưng hô", "How you address each other")}</label>
      <div className="flex flex-wrap gap-2">
        {([["mình", "bạn"], ["anh", "em"], ["em", "anh"], ["chị", "em"], ["tớ", "cậu"], ["tui", "bà"]] as [string, string][]).map(([self, other]) =>
          <button type="button" key={`${self}-${other}`} className={addressSelf === self && addressOther === other ? "chip chip-active" : "chip"} onClick={() => { setAddressSelf(self); setAddressOther(other); }}>{self} - {other}</button>)}
      </div>
      <div className="flex gap-2">
        <input className="chip flex-1" maxLength={12} value={addressSelf} onChange={(e) => setAddressSelf(e.target.value)} placeholder={t("Bạn xưng", "You say")} />
        <input className="chip flex-1" maxLength={12} value={addressOther} onChange={(e) => setAddressOther(e.target.value)} placeholder={t("Gọi người ấy", "Call them")} />
      </div>
      <label>{t("Ngôn ngữ câu trả lời", "Reply language")}</label>
      <div className="flex flex-wrap gap-2">
        {([["vi", "Tiếng Việt"], ["en", "English"], ["mix", t("Song ngữ", "Bilingual")]] as [ReplyLanguage, string][]).map(([value, label]) =>
          <button type="button" key={value} className={replyLanguage === value ? "chip chip-active" : "chip"} onClick={() => pickLanguage(value)}>{label}</button>)}
      </div>
    </div>
    <div className="composer-card">
      <textarea value={text} maxLength={800} onChange={(e) => setText(e.target.value)} placeholder={mode === "reply" ? t("Dán tin nhắn của người ấy vào đây...", "Paste their message here...") : t("Mô tả profile, bio hoặc ảnh của người ấy...", "Describe their profile, bio or photo...")} />
      <span>{text.length}/800</span>
    </div>
    {mode === "opener" && <div className="upload-block">
      <input ref={fileRef} type="file" accept={ACCEPTED_IMAGE_TYPES.join(",")} hidden onChange={(e) => void pickPhoto(e.target.files?.[0])} />
      {photo
        ? <div className="upload-preview">
            <img src={photo} alt={t("Ảnh đã chọn", "Selected photo")} />
            <button type="button" aria-label={t("Bỏ ảnh", "Remove photo")} onClick={() => { setPhoto(null); if (fileRef.current) fileRef.current.value = ""; }}><X size={14} /></button>
          </div>
        : <button type="button" className="chip" onClick={() => fileRef.current?.click()}>
            <ImagePlus size={16} />{t("Hoặc tải ảnh profile/bio lên", "Or upload a profile/bio photo")}
          </button>}
    </div>}
    <Button variant="gradient" size="lg" onClick={generate} disabled={loading || (!text.trim() && !(mode === "opener" && photo))}>
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
