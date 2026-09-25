import type { ReactNode } from "react";
import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { ArrowLeft, History, Home, Lightbulb, MessageCircle, UserRound } from "lucide-react";
import { LangToggle, useLang } from "./Language";
import { Button } from "@/components/ui/button";
import { companionGenderMix, navLabel, relativeTime, useCompanions } from "@/lib/tangpt-companions";
import { REPLY_HELPER_ENABLED } from "@/lib/tangpt-config";
import { LegalFooter } from "./LegalFooter";

const companionItems = [
  { to: "/app/ai", icon: MessageCircle, vi: "Bạn gái AI", en: "AI girlfriend", exact: false },
  { to: "/app/me", icon: UserRound, vi: "Tôi", en: "Me", exact: false },
] as const;

const items = REPLY_HELPER_ENABLED
  ? [
      { to: "/app", icon: Lightbulb, vi: "Gợi ý", en: "Ideas", exact: true } as const,
      companionItems[0],
      { to: "/app/history", icon: History, vi: "Lịch sử", en: "History", exact: false } as const,
      companionItems[1],
    ]
  : companionItems;

// Deterministic parent for each app screen. Browser history is not used because earlier
// entries are often /login or /onboarding, which immediately redirect back into /app.
function parentOf(pathname: string): string {
  const p = pathname.replace(/\/$/, "");
  if (p === "/app" || p === "/app/ai") return "/";
  if (p.startsWith("/app/admin/personas/")) return "/app/admin/personas";
  if (p.startsWith("/app/persona/") || p.startsWith("/app/chat/")) return "/app/ai";
  return "/app";
}

export function AppShell({ children }: { children: ReactNode }) {
  const { lang, t } = useLang();
  const router = useRouter();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { rows } = useCompanions(pathname.startsWith("/app/chat") ? pathname : "list");
  const mix = companionGenderMix((rows ?? []).map((row) => row.persona_gender));
  const label = (item: (typeof items)[number]) => (item.to === "/app/ai" ? navLabel(mix, lang === "vi") : lang === "vi" ? item.vi : item.en);
  const chat = pathname.startsWith("/app/chat");
  const homeLabel = t("Trang chủ", "Home");
  const sideNav = <aside className="side-nav">
    <Link to="/app" className="brand"><span>Tán</span>GPT<i /></Link>
    {items.map((item) => {
      const Icon = item.icon;
      return <Link key={item.to} to={item.to} activeOptions={{ exact: item.exact }} activeProps={{ className: "active" }}><Icon /><span>{label(item)}</span></Link>;
    })}
    <Link to="/" className="side-home"><Home /><span>{homeLabel}</span></Link>
  </aside>;

  if (chat) {
    const activeId = pathname.split("/")[3];
    return <div className="chat-desktop">
      {sideNav}
      <aside className="chat-desktop-list">
        <h2>{t("Cuộc trò chuyện", "Conversations")}</h2>
        <div className="chat-list">{(rows ?? []).map((row) => <Link key={row.id} to="/app/chat/$companionId" params={{ companionId: row.id }} className={row.id === activeId ? "active" : ""}>
          <div className="avatar-orbit small"><span>{row.name[0]}</span></div>
          <div className="min-w-0"><strong>{row.name}</strong><p>{row.last_message_preview || row.personality}</p></div>
          <time>{relativeTime(row.last_message_at ?? row.created_at, lang === "vi")}</time>
        </Link>)}</div>
      </aside>
      <div className="chat-desktop-main">{children}</div>
    </div>;
  }

  return <div className="app-layout">
    {sideNav}
    <main className="app-shell">
      <header className="app-top">
        <div className="nav-side">
          <Button variant="ghost" size="sm" aria-label={t("Quay lại", "Back")} onClick={() => router.navigate({ to: parentOf(pathname) })}><ArrowLeft />{t("Quay lại", "Back")}</Button>
          <Link to="/app" className="brand"><span>Tán</span>GPT<i /></Link>
        </div>
        <div className="top-actions">
          <Button asChild variant="ghost" size="icon" aria-label={homeLabel} title={homeLabel}><Link to="/"><Home /></Link></Button>
          <LangToggle />
        </div>
      </header>
      <div className="app-content">{children}<LegalFooter /></div>
      <nav className="bottom-nav" data-item-count={items.length}>
        {items.map((item) => {
          const Icon = item.icon;
          return <Link key={item.to} to={item.to} activeOptions={{ exact: item.exact }} activeProps={{ className: "active" }}><Icon /><span>{label(item)}</span></Link>;
        })}
      </nav>
    </main>
  </div>;
}
