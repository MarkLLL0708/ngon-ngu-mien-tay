import { createFileRoute, redirect } from "@tanstack/react-router";
import { OnboardingFlow } from "@/components/tangpt/OnboardingFlow";
import { GuestGate } from "@/components/tangpt/GuestGate";
import { supabase } from "@/integrations/supabase/client";
import { TEST_GUEST_MODE } from "@/lib/tangpt-config";

export const Route = createFileRoute("/onboarding")({
  ssr: false,
  beforeLoad: async () => {
    if (TEST_GUEST_MODE) return;
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/login" });
  },
  head: () => ({ meta: [
    { title: "Thiết lập ban đầu — TánGPT" },
    { name: "description", content: "Xác nhận độ tuổi, chọn vùng miền và nhóm tuổi trước khi bắt đầu." },
    { property: "og:title", content: "Thiết lập ban đầu — TánGPT" },
    { property: "og:description", content: "Xác nhận độ tuổi, chọn vùng miền và nhóm tuổi trước khi bắt đầu." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: () => <GuestGate><OnboardingFlow /></GuestGate>,
});
