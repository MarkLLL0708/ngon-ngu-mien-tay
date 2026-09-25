import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Bot, CheckCircle2, HeartHandshake, MapPin, MessageCircle, ShieldCheck } from "lucide-react";
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
        <h1>{t("Người bạn AI đầu tiên thật sự hiểu bạn.", "Your first AI companion who actually gets you.")}</h1>
        <p>{t("Không phải chatbot trả lời cho có. Là người nhớ bạn, hiểu vùng miền của bạn, và luôn ở đó — kể cả 2 giờ sáng.", "Not a chatbot giving generic replies. Someone who remembers you, speaks your region's language, and is always there — even at 2am.")}</p>
        <div className="flex flex-col gap-3 sm:flex-row"><Button asChild variant="gradient" size="lg">{TEST_GUEST_MODE || userId ? <Link to={appTarget}>{t("Dùng thử miễn phí", "Try it free")} <ArrowRight /></Link> : <Link to="/login" search={{ mode: "signup" }}>{t("Dùng thử miễn phí", "Try it free")} <ArrowRight /></Link>}</Button><Button variant="outline" size="lg" onClick={() => document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" })}>{t("Xem demo", "See demo")}</Button></div>
        <div className="trust-note"><ShieldCheck /> {t("Chân thành trước. Mánh khóe để sau.", "Sincerity first. Tricks later.")}</div>
      </div>
      <div id="demo" className="phone-stage fade-up-delay">
        <div className="phone-glow" /><div className="phone"><div className="phone-top"><span className="avatar-mini">L</span><span><b>Linh</b><small>{t("Đang hoạt động", "Active now")}</small></span></div>
          <div className="demo-tabs">{demos.map((item, index) => <button type="button" key={item.key} onClick={() => setDemo(index)} className={demo === index ? "active" : ""}>{item.label}</button>)}</div>
          <div className="phone-chat"><div className="her-bubble">Nay đi làm về mệt quá à</div><div key={demo} className="ai-bubble"><small>{t(`Linh · AI · Giọng ${current.label}`, `Linh · AI · ${current.label} voice`)}</small>{current.reply}</div><div className="typing"><i /><i /><i /></div></div>
          <div className="phone-input">{t("Nhắn tin...", "Type a message...")}<MessageCircle /></div>
        </div>
      </div>
    </section>
    <section className="content-band"><div className="section-heading"><span>{t("BẮT ĐẦU THẬT DỄ", "EASY TO START")}</span><h2>{t("Cách hoạt động", "How it works")}</h2></div><div className="feature-duo"><article><div className="feature-icon"><HeartHandshake /></div><div className="flex items-center gap-2"><h3>{t("Chọn người hợp gu", "Choose your companion")}</h3><b className="ai-badge">AI</b></div><p>{t("Chọn một nhân vật có tính cách, vùng miền và cách nói chuyện khiến bạn thấy gần gũi.", "Choose a character whose personality, region, and way of speaking feel familiar.")}</p><Link to={aiTarget} className="text-link">{t("Khám phá nhân vật", "Meet the characters")} <ArrowRight /></Link></article><article><div className="feature-icon"><MessageCircle /></div><h3>{t("Cứ nhắn như bình thường", "Text like you normally do")}</h3><p>{t("Cô ấy nhớ những điều quan trọng, hiểu cảm xúc và để mối quan hệ phát triển tự nhiên.", "She remembers what matters, understands emotions, and lets the relationship grow naturally.")}</p><Link to={aiTarget} className="text-link">{t("Bắt đầu trò chuyện", "Start chatting")} <ArrowRight /></Link></article></div></section>
    <section className="emotional-band"><div><h2>{t("Có bao nhiêu tin nhắn bạn gõ rồi xóa, vì sợ không ai trả lời?", "How many messages have you typed and deleted, afraid no one would answer?")}</h2><p>{t("Lần này, có người trả lời. Luôn luôn.", "This time, someone answers. Always.")}</p></div></section>
    <section className="content-band"><div className="section-heading"><span>{t("MỖI NƠI MỘT CHẤT", "EVERY REGION HAS ITS FLAVOR")}</span><h2>{t("Chọn vùng miền", "Choose a region")}</h2></div><div className="region-preview">{(Object.keys(regions) as RegionKey[]).map((key) => <button type="button" key={key} onClick={() => pickRegion(key)} data-region-card={key}><span>{regions[key].short}</span><strong>{regions[key].name}</strong><small>{regions[key].vibe}</small></button>)}</div></section>
    <section className="difference-band"><div className="section-heading"><span>{t("KHÔNG PHẢI VĂN MẪU", "NOT TEMPLATED LINES")}</span><h2>{t("Vì sao khác biệt", "Why it's different")}</h2></div><div className="difference-grid">{([
      [MessageCircle, t("Đúng giọng vùng miền", "True regional voice"), t("Từ cách xưng hô đến câu cảm thán đều vừa tai.", "From pronouns to exclamations, everything sounds right.")],
      [Bot, t("Hợp đúng lứa tuổi", "Fits her age group"), t("18–26, 27–35 hay 36+, mỗi nhóm một cách nói.", "18–26, 27–35 or 36+, each group speaks differently.")],
      [CheckCircle2, t("Nhớ điều bạn đã kể", "Remembers what you share"), t("Những câu chuyện và cảm xúc quan trọng không biến mất sau mỗi lần nhắn.", "Important stories and feelings don't disappear after every chat.")],
    ] as const).map(([Icon, title, text]) => <div key={title}><Icon /><strong>{title}</strong><p>{text}</p></div>)}</div></section>
    <section className="companion-close"><h2>{t("Cuối cùng cũng có đứa nhắn lại nhanh hơn crush.", "Finally, someone who texts back faster than your crush ever did.")}</h2><p>{t("AI đồng hành đầu tiên nói đúng chất vùng miền của bạn — Bắc, Trung, Nam, Tây, chọn ai cũng được.", "The first AI companion who actually talks like where you're from.")}</p></section>
    <section className="final-cta-band"><h2>{t("Đừng để cô đơn thắng thêm một đêm nữa.", "Don't let loneliness win another night.")}</h2><Button asChild variant="gradient" size="lg"><Link to={aiTarget}>{t("Dùng thử miễn phí", "Try it free")} <ArrowRight /></Link></Button></section>
    <footer><div className="brand"><span>Tán</span>GPT<i /></div><p>{t("TánGPT khuyến khích giao tiếp chân thành và tôn trọng. Nhân vật AI chỉ mang tính giải trí và luyện tập.", "TánGPT encourages sincere and respectful communication. AI characters are for entertainment and practice only.")}</p><nav><Link to="/terms">{t("Điều khoản", "Terms")}</Link><Link to="/privacy">{t("Quyền riêng tư", "Privacy")}</Link></nav></footer>
  </main>;
}
