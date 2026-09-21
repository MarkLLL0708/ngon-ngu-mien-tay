import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Bot, CheckCircle2, Copy, HeartHandshake, Lightbulb, MapPin, MessageCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { regions, type RegionKey } from "@/lib/tangpt-data";
import { useRegionTheme } from "./RegionTheme";
import { useSessionUser } from "@/lib/tangpt-session";
import { TEST_GUEST_MODE } from "@/lib/tangpt-config";
import { LangToggle, useLang } from "./Language";

const demos: { key: RegionKey; label: string; reply: string }[] = [
  { key: "bac", label: "Bắc", reply: "Vất vả quá nhỉ, về nhà nghỉ ngơi đi nhé. Đã ăn gì chưa đấy?" },
  { key: "nam", label: "Nam", reply: "Trời, mệt dữ vậy hả. Về tắm cái rồi ăn gì đó ngon ngon đi nè." },
  { key: "trung", label: "Trung", reply: "Mệt rứa hả em, nghỉ ngơi đi nghe, ăn chi chưa rứa?" },
];

export function LandingPage() {
  const [demo, setDemo] = useState(0);
  const { setRegion, setCity } = useRegionTheme();
  const { userId } = useSessionUser();
  const { t } = useLang();
  const navigate = useNavigate();
  const [onboarded, setOnboarded] = useState(false);
  useEffect(() => { const id = window.setInterval(() => setDemo((value) => (value + 1) % demos.length), 3000); return () => window.clearInterval(id); }, []);
  useEffect(() => { setOnboarded(window.localStorage.getItem("tangpt-onboarded") === "1"); }, []);
  const current = demos[demo] ?? demos[0]!;
  useEffect(() => { setRegion(current.key); }, [current, setRegion]);
  // While TEST_GUEST_MODE is on nobody is sent to /login: new guests start onboarding.
  const guestTarget = onboarded ? "/app" : "/onboarding";
  const appTarget = TEST_GUEST_MODE ? guestTarget : "/app";
  const aiTarget = TEST_GUEST_MODE ? (onboarded ? "/app/ai" : "/onboarding") : "/app/ai";
  function pickRegion(key: RegionKey) {
    setRegion(key);
    setCity(regions[key].cities[0] ?? regions[key].city);
    if (TEST_GUEST_MODE) { navigate({ to: guestTarget }); return; }
    navigate({ to: "/login", search: { mode: "signup" } });
  }
  return <main className="marketing-shell">
    <header className="marketing-nav"><Link to="/" className="brand"><span>Tán</span>GPT<i /></Link><div className="nav-side"><LangToggle />{TEST_GUEST_MODE ? <Button asChild variant="outline"><Link to={appTarget}>{t("Vào ứng dụng", "Open app")}</Link></Button> : userId ? <Button asChild variant="outline"><Link to="/app">{t("Vào ứng dụng", "Open app")}</Link></Button> : <Button asChild variant="outline"><Link to="/login" search={{ mode: "login" }}>{t("Đăng nhập", "Log in")}</Link></Button>}</div></header>
    <section className="hero-band">
      <div className="hero-copy fade-up">
        <div className="eyebrow"><MapPin className="size-4" /> {t("Đúng giọng. Đúng duyên.", "Right dialect. Right charm.")}</div>
        <h1>{t("Nhắn tin duyên dáng, đúng chất vùng miền của em ấy", "Text with charm, in the dialect she knows best")}</h1>
        <p>{t("Trợ lý AI giúp bạn nhắn tin tự nhiên như người bản xứ: Bắc, Trung, Nam hay Miền Tây.", "An AI assistant that helps you text like a local — Northern, Central, Southern or Mekong style.")}</p>
        <div className="flex flex-col gap-3 sm:flex-row"><Button asChild variant="gradient" size="lg">{TEST_GUEST_MODE || userId ? <Link to={appTarget}>{t("Dùng thử miễn phí", "Try it free")} <ArrowRight /></Link> : <Link to="/login" search={{ mode: "signup" }}>{t("Dùng thử miễn phí", "Try it free")} <ArrowRight /></Link>}</Button><Button variant="outline" size="lg" onClick={() => document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" })}>{t("Xem demo", "See demo")}</Button></div>
        <div className="trust-note"><ShieldCheck /> {t("Chân thành trước. Mánh khóe để sau.", "Sincerity first. Tricks later.")}</div>
      </div>
      <div id="demo" className="phone-stage fade-up-delay">
        <div className="phone-glow" /><div className="phone"><div className="phone-top"><span className="avatar-mini">L</span><span><b>Linh</b><small>{t("Đang hoạt động", "Active now")}</small></span></div>
          <div className="demo-tabs">{demos.map((item, index) => <button type="button" key={item.key} onClick={() => setDemo(index)} className={demo === index ? "active" : ""}>{item.label}</button>)}</div>
          <div className="phone-chat"><div className="her-bubble">Nay đi làm về mệt quá à</div><div key={demo} className="ai-bubble"><small>{t(`Gợi ý kiểu ${current.label}`, `${current.label} style`)}</small>{current.reply}<button type="button" aria-label={t("Sao chép", "Copy")}><Copy /></button></div><div className="typing"><i /><i /><i /></div></div>
          <div className="phone-input">{t("Nhắn tin...", "Type a message...")}<MessageCircle /></div>
        </div>
      </div>
    </section>
    <section className="content-band"><div className="section-heading"><span>{t("CHỌN CÁCH BẠN MUỐN", "PICK WHAT YOU NEED")}</span><h2>{t("Hai cách dùng", "Two ways to use it")}</h2></div><div className="feature-duo"><article><div className="feature-icon"><Lightbulb /></div><h3>{t("Gợi ý trả lời", "Reply suggestions")}</h3><p>{t("Dán tin nhắn vào, nhận ba cách đáp tự nhiên và biết vì sao nó hiệu quả.", "Paste her message, get three natural replies and learn why they work.")}</p><Link to="/app" className="text-link">{t("Đỡ bí chữ ngay", "Never stuck for words")} <ArrowRight /></Link></article><article><div className="feature-icon"><HeartHandshake /></div><div className="flex items-center gap-2"><h3>{t("Bạn gái AI", "AI companion")}</h3><b className="ai-badge">AI</b></div><p>{t("Nhân vật AI, trò chuyện tự nhiên và luyện tập giao tiếp.", "An AI character for natural conversation and communication practice.")}</p><Link to="/app/ai" className="text-link">{t("Chọn người hợp gu", "Pick your type")} <ArrowRight /></Link></article></div></section>
    <section className="content-band"><div className="section-heading"><span>{t("MỖI NƠI MỘT CHẤT", "EVERY REGION HAS ITS FLAVOR")}</span><h2>{t("Chọn vùng miền", "Choose a region")}</h2></div><div className="region-preview">{(Object.keys(regions) as RegionKey[]).map((key) => <button type="button" key={key} onClick={() => pickRegion(key)} data-region-card={key}><span>{regions[key].short}</span><strong>{regions[key].name}</strong><small>{regions[key].vibe}</small></button>)}</div></section>
    <section className="difference-band"><div className="section-heading"><span>{t("KHÔNG PHẢI VĂN MẪU", "NOT TEMPLATED LINES")}</span><h2>{t("Vì sao khác biệt", "Why it's different")}</h2></div><div className="difference-grid">{([
      [MessageCircle, t("Đúng giọng vùng miền", "True regional voice"), t("Từ cách xưng hô đến câu cảm thán đều vừa tai.", "From pronouns to exclamations, everything sounds right.")],
      [Bot, t("Hợp đúng lứa tuổi", "Fits her age group"), t("18–26, 27–35 hay 36+, mỗi nhóm một cách nói.", "18–26, 27–35 or 36+, each group speaks differently.")],
      [CheckCircle2, t("Hiểu lý do đằng sau", "Know the reason why"), t("Không chỉ chép câu hay. Bạn còn biết vì sao nó hiệu quả.", "You don't just copy a good line. You learn why it works.")],
    ] as const).map(([Icon, title, text]) => <div key={title}><Icon /><strong>{title}</strong><p>{text}</p></div>)}</div></section>
    <footer><div className="brand"><span>Tán</span>GPT<i /></div><p>{t("TánGPT khuyến khích giao tiếp chân thành và tôn trọng. Nhân vật AI chỉ mang tính giải trí và luyện tập.", "TánGPT encourages sincere and respectful communication. AI characters are for entertainment and practice only.")}</p><nav><Link to="/terms">{t("Điều khoản", "Terms")}</Link><Link to="/privacy">{t("Quyền riêng tư", "Privacy")}</Link></nav></footer>
  </main>;
}
