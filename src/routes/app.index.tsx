import { createFileRoute } from "@tanstack/react-router";
import { SuggestTab } from "@/components/tangpt/SuggestTab";

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [
    { title: "Gợi ý nhắn tin — TánGPT" },
    { name: "description", content: "Nhận ba cách trả lời tự nhiên theo vùng miền và độ tuổi." },
    { property: "og:title", content: "Gợi ý nhắn tin — TánGPT" },
    { property: "og:description", content: "Nhận ba cách trả lời tự nhiên theo vùng miền và độ tuổi." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: SuggestTab,
});
