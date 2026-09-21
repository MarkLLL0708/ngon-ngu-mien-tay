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

  async function finish() {
    setBusy(true);
    await save({ age_confirmed: true, default_region: region, default_city: city, age_group: age });
    window.localStorage.setItem("tangpt-onboarded", "1");
    window.localStorage.setItem("tangpt-age", age);
    setBusy(false);
    navigate({ to: "/app" });
  }

  return <main className="onboarding-shell">
    <header>
      <div className="nav-side"><BackButton /><span className="brand"><span>Tán</span>GPT<i /></span></div>
      <div className="progress-dots">{[0, 1, 2].map((i) => <i key={i} className={i <= step ? "active" : ""} />)}</div>
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
        <span className="step-label">{t("BƯỚC 3/3", "STEP 3/3")}</span>
        <h1>{t("Em ấy khoảng bao nhiêu tuổi?", "Roughly how old is she?")}</h1>
        <p>{t("Mỗi lứa tuổi có một nhịp trò chuyện khác nhau.", "Every age group has its own rhythm of conversation.")}</p>
        <div className="age-grid">{(["18-26", "27-35", "36+"] as AgeGroup[]).map((value) => <button type="button" key={value} className={age === value ? "active" : ""} onClick={() => setAge(value)}>{value}</button>)}</div>
        <Button variant="gradient" size="lg" disabled={busy} onClick={finish}>{t("Bắt đầu", "Start")}</Button>
      </>}
    </section>
  </main>;
}
