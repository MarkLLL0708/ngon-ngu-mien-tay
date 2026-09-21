import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Sparkle, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RegionPicker } from "./RegionPicker";
import { useRegionTheme } from "./RegionTheme";
import { LangToggle, useLang } from "./Language";
import { BackButton } from "./BackButton";
import { supabase } from "@/integrations/supabase/client";
import type { AgeGroup } from "@/lib/tangpt-data";
import type { UserGender } from "@/lib/tangpt-profile";

export function OnboardingFlow() {
  const [step, setStep] = useState(0);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [age, setAge] = useState<AgeGroup>("18-26");
  const [gender, setGender] = useState<UserGender>("unspecified");
  const [addressSelf, setAddressSelf] = useState("mình");
  const [addressOther, setAddressOther] = useState("bạn");
  const [busy, setBusy] = useState(false);
  const { region, city } = useRegionTheme();
  const { t } = useLang();
  const navigate = useNavigate();

  async function save(patch: Record<string, unknown>) {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    await supabase.from("profiles").upsert({ id: data.user.id, ...patch });
  }

  async function confirmAge() {
    setBusy(true);
    await save({ age_confirmed: true });
    setBusy(false);
    setStep(1);
  }

  async function saveRegion() {
    setBusy(true);
    await save({ age_confirmed: true, default_region: region, default_city: city });
    setBusy(false);
    setStep(2);
  }

  async function saveAge() {
    setBusy(true);
    await save({ age_confirmed: true, default_region: region, default_city: city, age_group: age });
    window.localStorage.setItem("tangpt-age", age);
    setBusy(false);
    setStep(3);
  }

  async function finish(withAddress: boolean) {
    setBusy(true);
    await save({ age_confirmed: true, default_region: region, default_city: city, age_group: age, ...(withAddress ? { gender } : {}) });
    if (withAddress) {
      window.localStorage.setItem("tangpt-address-self", addressSelf.trim().slice(0, 12) || "mình");
      window.localStorage.setItem("tangpt-address-other", addressOther.trim().slice(0, 12) || "bạn");
    }
    window.localStorage.setItem("tangpt-onboarded", "1");
    setBusy(false);
    navigate({ to: "/app" });
  }

  return <main className="onboarding-shell">
    <header>
      <div className="nav-side"><BackButton /><span className="brand"><span>Tán</span>GPT<i /></span></div>
      <div className="progress-dots">{[0, 1, 2, 3].map((i) => <i key={i} className={i <= step ? "active" : ""} />)}</div>
      <LangToggle />
    </header>
    <section className="onboarding-card fade-up">
      {step === 0 && <>
        <div className="line-illustration"><UserRound /></div>
        <span className="step-label">{t("BƯỚC 1/3", "STEP 1/3")}</span>
        <h1>{t("Trước khi bắt đầu", "Before we start")}</h1>
        <p>{t("Ứng dụng dành cho người từ 18 tuổi trở lên. Nhân vật là AI, không phải người thật.", "This app is for people aged 18 and over. The characters are AI, not real people.")}</p>
        <label className="confirm-row">
          <input type="checkbox" checked={ageConfirmed} onChange={(e) => setAgeConfirmed(e.target.checked)} />
          <span><b>{t("Tôi xác nhận tôi đủ 18 tuổi", "I confirm I am 18 or older")}</b><small>{t("Mình cần bạn xác nhận để giữ trải nghiệm phù hợp.", "We need this to keep the experience appropriate.")}</small></span>
        </label>
        <Button variant="gradient" size="lg" disabled={!ageConfirmed || busy} onClick={confirmAge}>{t("Tiếp tục", "Continue")}</Button>
      </>}
      {step === 1 && <>
        <span className="step-label">{t("BƯỚC 2/3", "STEP 2/3")}</span>
        <h1>{t("Em ấy đến từ đâu?", "Where is she from?")}</h1>
        <p>{t("Chọn đúng vùng, câu chữ sẽ nghe tự nhiên hơn hẳn.", "Pick the right region and every line sounds far more natural.")}</p>
        <RegionPicker />
        <Button variant="gradient" size="lg" disabled={busy} onClick={saveRegion}>{t(`Đã chọn ${city}`, `Selected ${city}`)}</Button>
      </>}
      {step === 2 && <>
        <div className="line-illustration"><Sparkle /></div>
        <span className="step-label">{t("BƯỚC 3/4", "STEP 3/4")}</span>
        <h1>{t("Em ấy khoảng bao nhiêu tuổi?", "Roughly how old is she?")}</h1>
        <p>{t("Mỗi lứa tuổi có một nhịp trò chuyện khác nhau.", "Every age group has its own rhythm of conversation.")}</p>
        <div className="age-grid">{(["18-26", "27-35", "36+"] as AgeGroup[]).map((value) => <button type="button" key={value} className={age === value ? "active" : ""} onClick={() => setAge(value)}>{value}</button>)}</div>
        <Button variant="gradient" size="lg" disabled={busy} onClick={saveAge}>{t("Tiếp tục", "Continue")}</Button>
      </>}
      {step === 3 && <>
        <div className="line-illustration"><UserRound /></div>
        <span className="step-label">{t("BƯỚC 4/4 · KHÔNG BẮT BUỘC", "STEP 4/4 · OPTIONAL")}</span>
        <h1>{t("Cách xưng hô", "How you address each other")}</h1>
        <p>{t("Cho mình biết bạn là ai và bạn muốn xưng hô thế nào, câu chữ sẽ đúng giọng hơn.", "Tell us who you are and how you like to address each other, so the lines sound right.")}</p>
        <label>{t("Bạn là", "You are")}</label>
        <div className="flex flex-wrap gap-2">
          {([["male", t("Nam", "Man")], ["female", t("Nữ", "Woman")], ["nonbinary", t("Phi nhị giới", "Non-binary")], ["unspecified", t("Không nói", "Prefer not to say")]] as [UserGender, string][]).map(([value, label]) =>
            <button type="button" key={value} className={gender === value ? "chip chip-active" : "chip"} onClick={() => setGender(value)}>{label}</button>)}
        </div>
        <label>{t("Cặp xưng hô", "Address pair")}</label>
        <div className="flex flex-wrap gap-2">
          {([["mình", "bạn"], ["anh", "em"], ["em", "anh"], ["chị", "em"], ["tớ", "cậu"], ["tui", "bà"]] as [string, string][]).map(([self, other]) =>
            <button type="button" key={`${self}-${other}`} className={addressSelf === self && addressOther === other ? "chip chip-active" : "chip"} onClick={() => { setAddressSelf(self); setAddressOther(other); }}>{self} - {other}</button>)}
        </div>
        <div className="flex gap-2">
          <input className="chip flex-1" maxLength={12} value={addressSelf} onChange={(e) => setAddressSelf(e.target.value)} placeholder={t("Bạn xưng", "You say")} />
          <input className="chip flex-1" maxLength={12} value={addressOther} onChange={(e) => setAddressOther(e.target.value)} placeholder={t("Gọi người ấy", "Call them")} />
        </div>
        <Button variant="gradient" size="lg" disabled={busy} onClick={() => finish(true)}>{t("Bắt đầu", "Start")}</Button>
        <button type="button" className="chip" disabled={busy} onClick={() => finish(false)}>{t("Bỏ qua bước này", "Skip this step")}</button>
      </>}
    </section>
  </main>;
}
