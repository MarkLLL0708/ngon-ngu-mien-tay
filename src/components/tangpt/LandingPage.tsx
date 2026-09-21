import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Bot, CheckCircle2, Copy, HeartHandshake, Lightbulb, MapPin, MessageCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { regions, type RegionKey } from "@/lib/tangpt-data";
import { useRegionTheme } from "./RegionTheme";
import { useSessionUser } from "@/lib/tangpt-session";

const demos: { key: RegionKey; label: string; reply: string }[] = [
  { key: "bac", label: "Bắc", reply: "Vất vả quá nhỉ, về nhà nghỉ ngơi đi nhé. Đã ăn gì chưa đấy?" },
  { key: "nam", label: "Nam", reply: "Trời, mệt dữ vậy hả. Về tắm cái rồi ăn gì đó ngon ngon đi nè." },
  { key: "trung", label: "Trung", reply: "Mệt rứa hả em, nghỉ ngơi đi nghe, ăn chi chưa rứa?" },
];

export function LandingPage() {
  const [demo, setDemo] = useState(0);
  const { setRegion, setCity } = useRegionTheme();
  const { userId } = useSessionUser();
  const navigate = useNavigate();
  useEffect(() => { const id = window.setInterval(() => setDemo((value) => (value + 1) % demos.length), 3000); return () => window.clearInterval(id); }, []);
  const current = demos[demo] ?? demos[0]!;
  useEffect(() => { setRegion(current.key); }, [current, setRegion]);
  function pickRegion(key: RegionKey) { setRegion(key); setCity(regions[key].cities[0] ?? regions[key].city); navigate({ to: "/login", search: { mode: "signup" } }); }
  return <main className="marketing-shell">
    <header className="marketing-nav"><Link to="/" className="brand"><span>Tán</span>GPT<i /></Link>{userId ? <Button asChild variant="outline"><Link to="/app">Vào ứng dụng</Link></Button> : <Button asChild variant="outline"><Link to="/login" search={{ mode: "login" }}>Đăng nhập</Link></Button>}</header>
    <section className="hero-band">
      <div className="hero-copy fade-up">
        <div className="eyebrow"><MapPin className="size-4" /> Đúng giọng. Đúng duyên.</div>
        <h1>Nhắn tin duyên dáng, đúng chất vùng miền của em ấy</h1>
        <p>Trợ lý AI giúp bạn nhắn tin tự nhiên như người bản xứ: Bắc, Trung, Nam hay Miền Tây.</p>
        <div className="flex flex-col gap-3 sm:flex-row"><Button asChild variant="gradient" size="lg">{userId ? <Link to="/app">Dùng thử miễn phí <ArrowRight /></Link> : <Link to="/login" search={{ mode: "signup" }}>Dùng thử miễn phí <ArrowRight /></Link>}</Button><Button variant="outline" size="lg" onClick={() => document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" })}>Xem demo</Button></div>
        <div className="trust-note"><ShieldCheck /> Chân thành trước. Mánh khóe để sau.</div>
      </div>
      <div id="demo" className="phone-stage fade-up-delay">
        <div className="phone-glow" /><div className="phone"><div className="phone-top"><span className="avatar-mini">L</span><span><b>Linh</b><small>Đang hoạt động</small></span></div>
          <div className="demo-tabs">{demos.map((item, index) => <button type="button" key={item.key} onClick={() => setDemo(index)} className={demo === index ? "active" : ""}>{item.label}</button>)}</div>
          <div className="phone-chat"><div className="her-bubble">Nay đi làm về mệt quá à</div><div key={demo} className="ai-bubble"><small>Gợi ý kiểu {demos[demo].label}</small>{demos[demo].reply}<button type="button" aria-label="Sao chép"><Copy /></button></div><div className="typing"><i /><i /><i /></div></div>
          <div className="phone-input">Nhắn tin...<MessageCircle /></div>
        </div>
      </div>
    </section>
    <section className="content-band"><div className="section-heading"><span>CHỌN CÁCH BẠN MUỐN</span><h2>Hai cách dùng</h2></div><div className="feature-duo"><article><div className="feature-icon"><Lightbulb /></div><h3>Gợi ý trả lời</h3><p>Dán tin nhắn vào, nhận ba cách đáp tự nhiên và biết vì sao nó hiệu quả.</p><Link to="/app" className="text-link">Đỡ bí chữ ngay <ArrowRight /></Link></article><article><div className="feature-icon"><HeartHandshake /></div><div className="flex items-center gap-2"><h3>Bạn gái AI</h3><b className="ai-badge">AI</b></div><p>Nhân vật AI, trò chuyện tự nhiên và luyện tập giao tiếp.</p><Link to="/app/ai" className="text-link">Chọn người hợp gu <ArrowRight /></Link></article></div></section>
    <section className="content-band"><div className="section-heading"><span>MỖI NƠI MỘT CHẤT</span><h2>Chọn vùng miền</h2></div><div className="region-preview">{(Object.keys(regions) as RegionKey[]).map((key) => <button type="button" key={key} onClick={() => pickRegion(key)} data-region-card={key}><span>{regions[key].short}</span><strong>{regions[key].name}</strong><small>{regions[key].vibe}</small></button>)}</div></section>
    <section className="difference-band"><div className="section-heading"><span>KHÔNG PHẢI VĂN MẪU</span><h2>Vì sao khác biệt</h2></div><div className="difference-grid">{[[MessageCircle,"Đúng giọng vùng miền","Từ cách xưng hô đến câu cảm thán đều vừa tai."],[Bot,"Hợp đúng lứa tuổi","18–26, 27–35 hay 36+, mỗi nhóm một cách nói."],[CheckCircle2,"Hiểu lý do đằng sau","Không chỉ chép câu hay. Bạn còn biết vì sao nó hiệu quả."]].map(([Icon,title,text]) => { const I=Icon as typeof MessageCircle; return <div key={title as string}><I /><strong>{title as string}</strong><p>{text as string}</p></div>;})}</div></section>
    <footer><div className="brand"><span>Tán</span>GPT<i /></div><p>TánGPT khuyến khích giao tiếp chân thành và tôn trọng. Nhân vật AI chỉ mang tính giải trí và luyện tập.</p><nav><Link to="/terms">Điều khoản</Link><Link to="/privacy">Quyền riêng tư</Link></nav></footer>
  </main>;
}
