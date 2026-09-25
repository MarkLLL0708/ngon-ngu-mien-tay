import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { MessageCircle, UserRound } from "lucide-react";
import { LangToggle, useLang } from "./Language";
import { BackButton } from "./BackButton";
import { companionGenderMix, navLabel, useCompanions } from "@/lib/tangpt-companions";
import { REPLY_HELPER_ENABLED } from "@/lib/tangpt-config";

const companionItems = [
  { to: "/app/ai", icon: MessageCircle, vi: "Bạn gái AI", en: "AI girlfriend", exact: false },
  { to: "/app/me", icon: UserRound, vi: "Tôi", en: "Me", exact: false },
] as const;

const items = REPLY_HELPER_ENABLED
  ? [{ to: "/app", icon: MessageCircle, vi: "Gợi ý", en: "Ideas", exact: true } as const, ...companionItems]
  : companionItems;

export function AppShell({ children }: { children: ReactNode }) {
  const { lang } = useLang();
  const { rows } = useCompanions();
  const mix = companionGenderMix((rows ?? []).map((row) => row.persona_gender));
  const label = (item: (typeof items)[number]) => (item.to === "/app/ai" ? navLabel(mix, lang === "vi") : lang === "vi" ? item.vi : item.en);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const bare = pathname.startsWith("/app/chat");
  if (bare) return <>{children}</>;
  return <div className="app-layout">
    <aside className="side-nav">
      <Link to="/app" className="brand"><span>Tán</span>GPT<i /></Link>
      {items.map((item) => {
        const Icon = item.icon;
        return <Link key={item.to} to={item.to} activeOptions={{ exact: item.exact }} activeProps={{ className: "active" }}><Icon /><span>{label(item)}</span></Link>;
      })}
    </aside>
    <main className="app-shell">
      <header className="app-top">
        <div className="nav-side"><BackButton /><Link to="/app" className="brand"><span>Tán</span>GPT<i /></Link></div>
        <div className="top-actions">
          <LangToggle />
        </div>
      </header>
      <div className="app-content">{children}</div>
      <nav className="bottom-nav">
        {items.map((item) => {
          const Icon = item.icon;
          return <Link key={item.to} to={item.to} activeOptions={{ exact: item.exact }} activeProps={{ className: "active" }}><Icon /><span>{label(item)}</span></Link>;
        })}
      </nav>
    </main>
  </div>;
}
