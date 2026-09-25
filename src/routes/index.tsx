import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/components/tangpt/LandingPage";

// No head() here: the home route inherits title/description/og/twitter from
// __root.tsx, and ships no og:image so serve-time hosting can inject the
// project's social preview (explicit og:image or latest screenshot).
export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "TánGPT — Người bạn AI đầu tiên thật sự hiểu bạn" },
    { name: "description", content: "Người bạn AI nhớ bạn, hiểu vùng miền của bạn và luôn ở đó — kể cả 2 giờ sáng." },
    { property: "og:title", content: "TánGPT — Người bạn AI thật sự hiểu bạn" },
    { property: "og:description", content: "Người bạn AI đầu tiên nói đúng chất vùng miền của bạn: Bắc, Trung, Nam hay Miền Tây." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: LandingPage,
});
