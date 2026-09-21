import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { TEST_GUEST_MODE } from "@/lib/tangpt-config";
import { ensureGuestSession } from "@/lib/tangpt-guest";
import { useLang } from "./Language";

/**
 * Makes sure a session exists before rendering app pages.
 * While TEST_GUEST_MODE is true an anonymous guest is created automatically;
 * otherwise a signed-out visitor is sent to /login.
 */
export function GuestGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const { t } = useLang();
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    (async () => {
      const userId = await ensureGuestSession();
      if (!active) return;
      if (!userId && !TEST_GUEST_MODE) { navigate({ to: "/login", replace: true }); return; }
      setReady(true);
    })();
    return () => { active = false; };
  }, [navigate]);

  if (!ready) return <div className="guest-loading"><i /><span>{t("Đang chuẩn bị phiên của bạn...", "Preparing your session...")}</span></div>;
  return <>{children}</>;
}
