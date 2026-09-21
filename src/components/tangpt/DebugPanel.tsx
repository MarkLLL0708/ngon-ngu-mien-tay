import { Component, useEffect, useState, type ErrorInfo, type ReactNode } from "react";
import { useRouterState } from "@tanstack/react-router";
import { attachGlobalDebugCapture, logDebug, readDebug, useDebugState } from "@/lib/debug-bus";
import { DEBUG, TEST_GUEST_MODE } from "@/lib/tangpt-config";
import { supabase } from "@/integrations/supabase/client";

/** Shows the error message and component stack instead of a blank page. */
export class AppErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null; where: string }> {
  override state = { error: null as Error | null, where: "" };

  static getDerivedStateFromError(error: Error) {
    return { error, where: "" };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    const where = (info.componentStack ?? "").trim().split("\n")[0]?.trim() ?? "";
    this.setState({ where });
    logDebug("error", `render crash ${where}: ${error.message}`);
  }

  override render() {
    if (!this.state.error) return this.props.children;
    return <div className="debug-crash">
      <h1>Lỗi hiển thị / Render error</h1>
      <p><b>{this.state.where || "component"}</b></p>
      <pre>{this.state.error.message}</pre>
      <button type="button" onClick={() => this.setState({ error: null, where: "" })}>Thử lại / Retry</button>
    </div>;
  }
}

type Flags = { guest: boolean; signedIn: boolean; age_confirmed: unknown; onboarding_done: unknown; primary_goal: unknown; voice_consent: unknown };

export function DebugPanel() {
  const [open, setOpen] = useState(false);
  const [flags, setFlags] = useState<Flags | null>(null);
  const { errors, navs, overlays } = useDebugState();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => { attachGlobalDebugCapture(); }, []);
  useEffect(() => { logDebug("nav", pathname); }, [pathname]);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user ?? null;
      let row: Record<string, unknown> | null = null;
      if (user) {
        const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
        row = (data as Record<string, unknown> | null) ?? null;
      }
      if (!active) return;
      setFlags({
        guest: user?.is_anonymous === true,
        signedIn: Boolean(user),
        age_confirmed: row?.["age_confirmed"] ?? null,
        onboarding_done: typeof window !== "undefined" ? window.localStorage.getItem("tangpt-onboarded") === "1" : null,
        primary_goal: row?.["primary_goal"] ?? null,
        voice_consent: typeof window !== "undefined" ? window.localStorage.getItem("tangpt-voice-consent") === "1" : null,
      });
    })();
    return () => { active = false; };
  }, [pathname]);

  if (!DEBUG) return null;

  function copyAll() {
    const snapshot = readDebug();
    const text = JSON.stringify({ pathname, flags, ...snapshot }, null, 2);
    void navigator.clipboard?.writeText(text);
  }

  return <div className="debug-panel">
    <button type="button" className="debug-toggle" onClick={() => setOpen((value) => !value)}>DEBUG {open ? "▾" : "▸"}</button>
    {open && <div className="debug-body">
      <div className="debug-row"><b>route</b><span>{pathname}</span></div>
      <div className="debug-row"><b>session</b><span>{flags ? (flags.guest ? "guest" : flags.signedIn ? "user" : "signed out") : "..."} {TEST_GUEST_MODE ? "(test)" : ""}</span></div>
      <div className="debug-row"><b>flags</b><span>age_confirmed={String(flags?.age_confirmed)} onboarding_done={String(flags?.onboarding_done)} primary_goal={String(flags?.primary_goal)} voice_consent={String(flags?.voice_consent)}</span></div>
      <div className="debug-row"><b>overlays</b><span>{overlays.length ? overlays.join(", ") : "none"}</span></div>
      <div className="debug-row"><b>nav</b><span>{navs.map((event) => event.text).join(" → ") || "none"}</span></div>
      <div className="debug-list">{errors.length === 0 ? <em>no errors</em> : errors.map((event) => <p key={event.id}>{event.text}</p>)}</div>
      <button type="button" className="debug-copy" onClick={copyAll}>Copy</button>
    </div>}
  </div>;
}
