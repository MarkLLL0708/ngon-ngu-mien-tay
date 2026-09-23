import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Sparkle, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RegionPicker } from "./RegionPicker";
import { RegionChipBar } from "./RegionChipBar";
import { useRegionTheme } from "./RegionTheme";
import { LangToggle, useLang } from "./Language";
import { BackButton } from "./BackButton";
import { GenderPairCards } from "./GenderPairCards";
import { supabase } from "@/integrations/supabase/client";
import { logDebug } from "@/lib/debug-bus";
import type { AgeGroup } from "@/lib/tangpt-data";
import { defaultAddress, type GenderPair } from "@/lib/tangpt-gender";

const STEPS = 6;

export function OnboardingFlow() {
  const [step, setStep] = useState(0);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [age, setAge] = useState<AgeGroup>("18-26");
  const [pair, setPair] = useState<GenderPair | null>(null);
  const [addressSelf, setAddressSelf] = useState("mình");
  const [addressOther, setAddressOther] = useState("bạn");
  const [busy, setBusy] = useState(false);
  const { region, city } = useRegionTheme();
  const { t } = useLang();
  const navigate = useNavigate();

  const pushedRef = useRef(0);

  const goStep = useCallback((next: number) => {
    setStep(next);
    logDebug("nav", `onboarding step ${next}`);
    window.history.pushState({ obStep: next }, "");
    pushedRef.current += 1;
  }, []);

  // Finished guests never land back on onboarding through history.
  useEffect(() => {
    if (window.localStorage.getItem("tangpt-onboarded") === "1") navigate({ to: "/app", replace: true });
  }, [navigate]);

  // Browser back walks the onboarding steps; from step 0 it leaves to the landing page.
  useEffect(() => {
    const onPop = (event: PopStateEvent) => {
      const state = (event.state ?? {}) as { obStep?: number };
      setStep(typeof state.obStep === "number" ? state.obStep : 0);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  function goBack() {
    if (step === 0) { navigate({ to: "/", replace: true }); return; }
    window.history.back();
  }

  async function save(patch: Record<string, unknown>) {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    await supabase.from("profiles").upsert({ id: data.user.id, ...patch });
  }

  async function confirmAge() {
    setBusy(true);
    await save({ age_confirmed: true });
    setBusy(false);
    goStep(1);
  }

  // One tap sets who you are and who you want to talk to together.
  function choosePair(next: GenderPair) {
    setPair(next);
    const [self, other] = defaultAddress(next.user, next.target);
    setAddressSelf(self);
    setAddressOther(other);
  }

  async function savePair() {
    if (!pair) return;
    setBusy(true);
    await save({ age_confirmed: true, user_gender: pair.user, default_target_gender: pair.target, gender: pair.user });
    setBusy(false);
    goStep(2);
  }

  async function pickRegion() {
    // Region is already applied to the theme; persist it and move on by itself.
    await save({ age_confirmed: true, default_region: region, default_city: city });
    goStep(3);
  }

  async function saveCity() {
    setBusy(true);
    await save({ age_confirmed: true, default_region: region, default_city: city });
    setBusy(false);
    goStep(4);
  }

  async function saveAge() {
    setBusy(true);
    await save({ age_confirmed: true, default_region: region, default_city: city, age_group: age });
    window.localStorage.setItem("tangpt-age", age);
    setBusy(false);
    goStep(5);
  }

  async function finish(withAddress: boolean) {
    setBusy(true);
    await save({ age_confirmed: true, default_region: region, default_city: city, age_group: age });
    if (withAddress) {
      window.localStorage.setItem("tangpt-address-self", addressSelf.trim().slice(0, 12) || "mình");
      window.localStorage.setItem("tangpt-address-other", addressOther.trim().slice(0, 12) || "bạn");
    }
    window.localStorage.setItem("tangpt-onboarded", "1");
    setBusy(false);
    // Drop the step entries first so history back from /app reaches the landing page.
    if (pushedRef.current > 0) {
      const steps = pushedRef.current;
      pushedRef.current = 0;
      await new Promise<void>((resolve) => {
        const done = () => { window.removeEventListener("popstate", done); resolve(); };
        window.addEventListener("popstate", done);
        window.history.go(-steps);
        window.setTimeout(done, 400);
      });
    }
    navigate({ to: "/app", replace: true });
  }

  return <main className="onboarding-shell">
    <header>
      <div className="nav-side"><BackButton onBack={goBack} /><span className="brand"><span>Tán</span>GPT<i /></span></div>
      <div className="progress-dots">{Array.from({ length: STEPS }, (_, i) => <i key={i} className={i <= step ? "active" : ""} />)}</div>
      <LangToggle />
    </header>
    <RegionChipBar />
    <section className="onboarding-card">
      {step === 0 && <>
        <div className="line-illustration"><UserRound /></div>
        <span className="step-label">{t("BƯỚC 1/6", "STEP 1/6")}</span>
        <h1>{t("Trước khi bắt đầu", "Before we start")}</h1>
        <p>{t("Ứng dụng dành cho người từ 18 tuổi trở lên. Nhân vật là AI, không phải người thật.", "This app is for people aged 18 and over. The characters are AI, not real people.")}</p>
        <label className="confirm-row">
          <input type="checkbox" checked={ageConfirmed} onChange={(e) => setAgeConfirmed(e.target.checked)} />
          <span><b>{t("Tôi xác nhận tôi đủ 18 tuổi", "I confirm I am 18 or older")}</b><small>{t("Xác nhận này mở trải nghiệm đồng hành dành riêng cho người trưởng thành.", "This confirmation enables the adults-only companion experience.")}</small></span>
        </label>
        <div className="anchored-actions"><Button variant="gradient" size="lg" disabled={!ageConfirmed || busy} onClick={confirmAge}>{t("Tiếp tục", "Continue")}</Button></div>
      </>}
      {step === 1 && <>
        <span className="step-label">{t("BƯỚC 2/6", "STEP 2/6")}</span>
        <h1>{t("Bạn muốn kết nối như thế nào?", "How do you want to connect?")}</h1>
        <GenderPairCards value={pair?.key ?? null} onChange={choosePair} />
        <div className="anchored-actions"><Button variant="gradient" size="lg" disabled={!pair || busy} onClick={savePair}>{t("Tiếp tục", "Continue")}</Button></div>
      </>}
      {step === 2 && <>
        <span className="step-label">{t("BƯỚC 3/6", "STEP 3/6")}</span>
        <h1>{t("Em ấy đến từ đâu?", "Where is she from?")}</h1>
        <p>{t("Chọn đúng vùng, câu chữ sẽ nghe tự nhiên hơn hẳn.", "Pick the right region and every line sounds far more natural.")}</p>
        <RegionPicker compact />
        <div className="anchored-actions"><Button variant="gradient" size="lg" disabled={busy} onClick={() => void pickRegion()}>{t("Tiếp tục", "Continue")}</Button></div>
      </>}
      {step === 3 && <>
        <span className="step-label">{t("BƯỚC 4/6", "STEP 4/6")}</span>
        <h1>{t("Thành phố nào?", "Which city?")}</h1>
        <p>{t("Chọn thành phố để giọng điệu sát hơn nữa.", "Pick a city so the tone fits even better.")}</p>
        <RegionPicker />
        <div className="anchored-actions"><Button variant="gradient" size="lg" disabled={busy} onClick={saveCity}>{t(`Tiếp tục với ${city}`, `Continue with ${city}`)}</Button></div>
      </>}
      {step === 4 && <>
        <div className="line-illustration"><Sparkle /></div>
        <span className="step-label">{t("BƯỚC 5/6", "STEP 5/6")}</span>
        <h1>{t("Em ấy khoảng bao nhiêu tuổi?", "Roughly how old is she?")}</h1>
        <p>{t("Mỗi lứa tuổi có một nhịp trò chuyện khác nhau.", "Every age group has its own rhythm of conversation.")}</p>
        <div className="age-grid">{(["18-26", "27-35", "36+"] as AgeGroup[]).map((value) => <button type="button" key={value} className={age === value ? "active" : ""} onClick={() => setAge(value)}>{value}</button>)}</div>
        <div className="anchored-actions"><Button variant="gradient" size="lg" disabled={busy} onClick={saveAge}>{t("Tiếp tục", "Continue")}</Button></div>
      </>}
      {step === 5 && <>
        <div className="line-illustration"><UserRound /></div>
        <span className="step-label">{t("BƯỚC 6/6 · KHÔNG BẮT BUỘC", "STEP 6/6 · OPTIONAL")}</span>
        <h1>{t("Cách xưng hô", "How you address each other")}</h1>
        <p>{t("Chọn cách xưng hô bạn thấy hợp, câu chữ sẽ đúng giọng hơn.", "Pick the pronouns that feel right, so the lines sound like you.")}</p>
        <label>{t("Cặp xưng hô", "Address pair")}</label>
        <div className="flex flex-wrap gap-2">
          {([["mình", "bạn"], ["anh", "em"], ["em", "anh"], ["chị", "em"], ["tớ", "cậu"], ["tui", "bà"]] as [string, string][]).map(([self, other]) =>
            <button type="button" key={`${self}-${other}`} className={addressSelf === self && addressOther === other ? "chip chip-active" : "chip"} onClick={() => { setAddressSelf(self); setAddressOther(other); }}>{self} - {other}</button>)}
        </div>
        <div className="flex gap-2">
          <input className="chip flex-1" maxLength={12} value={addressSelf} onChange={(e) => setAddressSelf(e.target.value)} placeholder={t("Bạn xưng", "You say")} />
          <input className="chip flex-1" maxLength={12} value={addressOther} onChange={(e) => setAddressOther(e.target.value)} placeholder={t("Gọi người ấy", "Call them")} />
        </div>
        <div className="anchored-actions">
          <Button variant="gradient" size="lg" disabled={busy} onClick={() => finish(true)}>{t("Bắt đầu", "Start")}</Button>
          <button type="button" className="chip" disabled={busy} onClick={() => finish(false)}>{t("Bỏ qua bước này", "Skip this step")}</button>
        </div>
      </>}
    </section>
  </main>;
}
