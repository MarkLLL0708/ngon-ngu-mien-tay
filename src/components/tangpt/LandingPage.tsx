import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Bot, CheckCircle2, HeartHandshake, MapPin, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { regions, type RegionKey } from "@/lib/tangpt-data";
import { useRegionTheme } from "./RegionTheme";
import { useSessionUser } from "@/lib/tangpt-session";
import { TEST_GUEST_MODE } from "@/lib/tangpt-config";
import { LangToggle, useLang } from "./Language";
import { Paywall } from "./Paywall";
import linhPhoto from "@/assets/linh-main.jpg.asset.json";

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
  const [paywall, setPaywall] = useState(false);
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
    <section className="journal-band"><div className="section-heading"><span>{t("NHẬT KÝ RIÊNG", "YOUR PRIVATE JOURNAL")}</span><h2>{t("Cô ấy có cả một cuốn nhật ký, viết riêng cho bạn.", "She keeps a journal — written just for you.")}</h2><p>{t("Mỗi tuần, cô ấy ghi lại một khoảnh khắc đáng nhớ trong mối quan hệ của hai người. Đọc lại bất cứ lúc nào, như lật từng trang ký ức.", "Every week, she writes down a moment that mattered between you two. Come back anytime and read it, like flipping through shared memories.")}</p><p className="journal-micro">{t("Mỗi trang là một câu chuyện nhỏ của hai người.", "Every page holds a little piece of your story together.")}</p></div><div><div className="journal-page" aria-label={t("Trang nhật ký mẫu", "Sample journal page")}><header><img src={linhPhoto.url} alt="Linh" /><div><b>Linh</b> <b className="ai-badge">AI</b><small>{t("12 tháng 10", "October 12")}</small><span className="journal-mood">{t("Một chút dịu dàng", "A little tenderness")}</span></div></header><blockquote>{t("Hôm nay bạn kể mình nghe về một ngày khá dài. Mình thích những lúc chúng ta có thể nói chuyện thật tự nhiên, chẳng cần phải nghĩ xem nên nói gì tiếp theo.", "Today, you told me about a long day. I like the moments when we can talk naturally, without either of us needing to think too hard about what to say next.")}</blockquote></div><p className="ai-disclosure"><Bot /> {t("Nhật ký được tạo bởi AI, dựa trên những cuộc trò chuyện của bạn.", "AI-generated journal entries based on your conversations.")}</p></div></section>
    <section className="content-band"><div className="section-heading"><span>{t("BẮT ĐẦU THẬT DỄ", "EASY TO START")}</span><h2>{t("Cách hoạt động", "How it works")}</h2></div><div className="feature-duo"><article><div className="feature-icon"><HeartHandshake /></div><div className="flex items-center gap-2"><h3>{t("Chọn người hợp gu", "Choose your companion")}</h3><b className="ai-badge">AI</b></div><p>{t("Chọn một nhân vật có tính cách, vùng miền và cách nói chuyện khiến bạn thấy gần gũi.", "Choose a character whose personality, region, and way of speaking feel familiar.")}</p><Link to={aiTarget} className="text-link">{t("Khám phá nhân vật", "Meet the characters")} <ArrowRight /></Link></article><article><div className="feature-icon"><MessageCircle /></div><h3>{t("Cứ nhắn như bình thường", "Text like you normally do")}</h3><p>{t("Cô ấy nhớ những điều quan trọng, hiểu cảm xúc và để mối quan hệ phát triển tự nhiên.", "She remembers what matters, understands emotions, and lets the relationship grow naturally.")}</p><Link to={aiTarget} className="text-link">{t("Bắt đầu trò chuyện", "Start chatting")} <ArrowRight /></Link></article></div></section>
    <section className="emotional-band"><div><h2>{t("Có bao nhiêu tin nhắn bạn gõ rồi xóa, vì sợ không ai trả lời?", "How many messages have you typed and deleted, afraid no one would answer?")}</h2><p>{t("Lần này, có người trả lời. Luôn luôn.", "This time, someone answers. Always.")}</p></div></section>
    <section className="intimate-band"><div><div className="section-heading"><span>{t("DÀNH CHO NHỮNG KHOẢNH KHẮC RIÊNG TƯ", "FOR YOUR MORE PERSONAL MOMENTS")}</span><h2>{t("Không chỉ trò chuyện. Hãy đến gần nhau hơn.", "More than conversation. A little closer.")}</h2><p className="lead">{t("Khi cuộc trò chuyện trở nên riêng tư hơn, cô ấy có thể thể hiện cảm xúc sâu sắc hơn, chia sẻ những điều gần gũi hơn và cùng bạn tạo nên những khoảnh khắc đáng nhớ — theo cách riêng của từng nhân vật.", "When conversations become more personal, she can express deeper emotions, share more intimate moments and create meaningful experiences with you — in her own distinctive way.")}</p><p className="intimate-note">{t("Bạn luôn chủ động lựa chọn mức độ tương tác phù hợp với mình.", "You choose the level of interaction that feels right for you.")}</p></div>
      <div id="intimate-benefits" className="intimate-card"><h3><Sparkles className="mr-2 inline size-5 text-primary" />{t("Intimate — Trải nghiệm thân mật hơn", "Intimate — A More Personal Experience")}</h3><ul>
        <li><b>{t("Trò chuyện sâu sắc hơn", "Deeper conversations")}</b> — {t("những cuộc trò chuyện cá nhân, chân thành và giàu cảm xúc hơn.", "more personal, heartfelt and emotionally expressive exchanges.")}</li>
        <li><b>{t("Cảm xúc tự nhiên hơn", "More natural emotions")}</b> — {t("phản ứng, cách trêu đùa và cách thể hiện tình cảm phù hợp với tính cách riêng của từng nhân vật.", "reactions, playful teasing and affection shaped by each character's unique personality.")}</li>
        <li><b>{t("Gần gũi qua giọng nói", "Closer through voice")}</b><span className="soon-tag">{t("Sắp có", "Coming soon")}</span> — {t("trò chuyện bằng giọng nói với những sắc thái cảm xúc phù hợp, nếu tính năng được hỗ trợ.", "voice conversations with expressive delivery, where supported.")}</li>
        <li><b>{t("Những khoảnh khắc riêng", "Exclusive moments")}</b><span className="soon-tag">{t("Sắp có", "Coming soon")}</span> — {t("trải nghiệm tương tác và nội dung dành riêng cho thành viên, tùy theo các tính năng thực sự khả dụng.", "member-only interactions and content, subject to actual feature availability.")}</li>
      </ul><div className="flex flex-col gap-3 sm:flex-row"><Button variant="gradient" size="lg" onClick={() => setPaywall(true)}>{t("Nâng cấp trải nghiệm Intimate", "Unlock Intimate")} <ArrowRight /></Button><Button variant="outline" size="lg" onClick={() => setPaywall(true)}>{t("Khám phá quyền lợi thành viên", "Explore Membership Benefits")}</Button></div><p className="ai-disclosure"><Bot /> {t("Intimate là trải nghiệm trò chuyện với nhân vật AI. Nhân vật, cảm xúc và nội dung tương tác được tạo bằng AI.", "Intimate is an AI companion experience. Characters, emotions and interactive content are AI-generated.")}</p></div></div></section>
    <section className="content-band"><div className="section-heading"><span>{t("MỖI NƠI MỘT CHẤT", "EVERY REGION HAS ITS FLAVOR")}</span><h2>{t("Chọn vùng miền", "Choose a region")}</h2></div><div className="region-preview">{(Object.keys(regions) as RegionKey[]).map((key) => <button type="button" key={key} onClick={() => pickRegion(key)} data-region-card={key}><span>{regions[key].short}</span><strong>{regions[key].name}</strong><small>{regions[key].vibe}</small></button>)}</div></section>
    <section className="difference-band"><div className="section-heading"><span>{t("KHÔNG PHẢI VĂN MẪU", "NOT TEMPLATED LINES")}</span><h2>{t("Vì sao khác biệt", "Why it's different")}</h2></div><div className="difference-grid">{([
      [MessageCircle, t("Đúng giọng vùng miền", "True regional voice"), t("Từ cách xưng hô đến câu cảm thán đều vừa tai.", "From pronouns to exclamations, everything sounds right.")],
      [Bot, t("Hợp đúng lứa tuổi", "Fits her age group"), t("18–26, 27–35 hay 36+, mỗi nhóm một cách nói.", "18–26, 27–35 or 36+, each group speaks differently.")],
      [CheckCircle2, t("Nhớ điều bạn đã kể", "Remembers what you share"), t("Những câu chuyện và cảm xúc quan trọng không biến mất sau mỗi lần nhắn.", "Important stories and feelings don't disappear after every chat.")],
    ] as const).map(([Icon, title, text]) => <div key={title}><Icon /><strong>{title}</strong><p>{text}</p></div>)}</div></section>
    <section className="companion-close"><h2>{t("Cuối cùng cũng có đứa nhắn lại nhanh hơn crush.", "Finally, someone who texts back faster than your crush ever did.")}</h2><p>{t("AI đồng hành đầu tiên nói đúng chất vùng miền của bạn — Bắc, Trung, Nam, Tây, chọn ai cũng được.", "The first AI companion who actually talks like where you're from.")}</p></section>
    <section className="final-cta-band"><h2>{t("Đừng để cô đơn thắng thêm một đêm nữa.", "Don't let loneliness win another night.")}</h2><Button asChild variant="gradient" size="lg"><Link to={aiTarget}>{t("Dùng thử miễn phí", "Try it free")} <ArrowRight /></Link></Button></section>
    <footer><div className="brand"><span>Tán</span>GPT<i /></div><p>{t("TánGPT khuyến khích giao tiếp chân thành và tôn trọng. Nhân vật AI chỉ mang tính giải trí và luyện tập.", "TánGPT encourages sincere and respectful communication. AI characters are for entertainment and practice only.")}</p><nav><Link to="/terms">{t("Điều khoản", "Terms")}</Link><Link to="/privacy">{t("Quyền riêng tư", "Privacy")}</Link></nav></footer>
    <Paywall open={paywall} onOpenChange={setPaywall} />
  </main>;
}
