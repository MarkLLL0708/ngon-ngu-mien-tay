import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { History, Lightbulb, MessageCircle, Settings2, UserRound } from "lucide-react";
import { RegionPicker } from "./RegionPicker";
import { useRegionTheme } from "./RegionTheme";
import { LangToggle, useLang } from "./Language";
import { regions } from "@/lib/tangpt-data";

const items = [
  { to: "/app", icon: Lightbulb, vi: "Gợi ý", en: "Ideas", exact: true },
  { to: "/app/ai", icon: MessageCircle, vi: "Bạn gái AI", en: "AI girlfriend", exact: false },
  { to: "/app/history", icon: History, vi: "Lịch sử", en: "History", exact: false },
  { to: "/app/me", icon: UserRound, vi: "Tôi", en: "Me", exact: false },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [picker, setPicker] = useState(false);
  const { region, city } = useRegionTheme();
  const { lang } = useLang();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const bare = pathname.startsWith("/app/chat");
  if (bare) return <>{children}</>;
  return <div className="app-layout">
    <aside className="side-nav">
      <Link to="/app" className="brand"><span>Tán</span>GPT<i /></Link>
      {items.map((item) => {
        const Icon = item.icon;
        return <Link key={item.to} to={item.to} activeOptions={{ exact: item.exact }} activeProps={{ className: "active" }}><Icon /><span>{lang === "vi" ? item.vi : item.en}</span></Link>;
      })}
    </aside>
    <main className="app-shell">
      <header className="app-top">
        <Link to="/app" className="brand"><span>Tán</span>GPT<i /></Link>
        <div className="top-actions">
          <button type="button" onClick={() => setPicker(!picker)} className="region-pill"><i />{regions[region].short} · {city}<Settings2 /></button>
          <LangToggle />
        </div>
      </header>
      {picker && <div className="picker-popover fade-up"><RegionPicker /></div>}
      <div className="app-content">{children}</div>
      <nav className="bottom-nav">
        {items.map((item) => {
          const Icon = item.icon;
          return <Link key={item.to} to={item.to} activeOptions={{ exact: item.exact }} activeProps={{ className: "active" }}><Icon /><span>{lang === "vi" ? item.vi : item.en}</span></Link>;
        })}
      </nav>
    </main>
  </div>;
}
