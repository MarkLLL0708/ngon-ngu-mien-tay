import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/components/tangpt/LandingPage";

// No head() here: the home route inherits title/description/og/twitter from
// __root.tsx, and ships no og:image so serve-time hosting can inject the
// project's social preview (explicit og:image or latest screenshot).
export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "TánGPT — Nhắn tin duyên dáng, đúng chất vùng miền" },
    { name: "description", content: "Trợ lý AI giúp bạn gợi ý trả lời và luyện tập trò chuyện tự nhiên theo vùng miền Việt Nam." },
    { property: "og:title", content: "TánGPT — Nhắn tin duyên dáng" },
    { property: "og:description", content: "Gợi ý trả lời tự nhiên như người bản xứ: Bắc, Trung, Nam hay Miền Tây." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: LandingPage,
});
