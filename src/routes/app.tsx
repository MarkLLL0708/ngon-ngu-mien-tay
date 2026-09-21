import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/tangpt/AppShell";
import { GuestGate } from "@/components/tangpt/GuestGate";
import { supabase } from "@/integrations/supabase/client";
import { TEST_GUEST_MODE } from "@/lib/tangpt-config";

export const Route = createFileRoute("/app")({
  ssr: false,
  beforeLoad: async () => {
    if (TEST_GUEST_MODE) return;
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/login" });
  },
  component: () => <GuestGate><AppShell><Outlet /></AppShell></GuestGate>,
});
