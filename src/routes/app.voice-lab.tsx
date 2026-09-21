import { createFileRoute, redirect } from "@tanstack/react-router";
import { VoiceLab } from "@/components/tangpt/VoiceLab";
import { TEST_GUEST_MODE } from "@/lib/tangpt-config";

export const Route = createFileRoute("/app/voice-lab")({
  ssr: false,
  beforeLoad: () => {
    if (!TEST_GUEST_MODE) throw redirect({ to: "/app" });
  },
  head: () => ({ meta: [
    { title: "Phòng thử giọng — TánGPT" },
    { name: "description", content: "Trang nội bộ để nghe mù và chấm điểm các giọng đọc tiếng Việt." },
    { property: "og:title", content: "Phòng thử giọng — TánGPT" },
    { property: "og:description", content: "Trang nội bộ để nghe mù và chấm điểm các giọng đọc tiếng Việt." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: VoiceLab,
});
