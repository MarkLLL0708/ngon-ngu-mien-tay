import { createFileRoute, redirect } from "@tanstack/react-router";
import { OnboardingFlow } from "@/components/tangpt/OnboardingFlow";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/onboarding")({
  ssr: false,
  beforeLoad: async () => {
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
  component: OnboardingFlow,
});
