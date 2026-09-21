import { createFileRoute } from "@tanstack/react-router";
import { CompanionTab } from "@/components/tangpt/CompanionTab";

export const Route = createFileRoute("/app/ai")({
  head: () => ({ meta: [
    { title: "Bạn gái AI — TánGPT" },
    { name: "description", content: "Chọn nhân vật AI theo vùng miền và luyện tập trò chuyện tự nhiên." },
    { property: "og:title", content: "Bạn gái AI — TánGPT" },
    { property: "og:description", content: "Chọn nhân vật AI theo vùng miền và luyện tập trò chuyện tự nhiên." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: CompanionTab,
});
