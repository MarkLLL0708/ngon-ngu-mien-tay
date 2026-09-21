import { createFileRoute } from "@tanstack/react-router";
import { HistoryTab } from "@/components/tangpt/HistoryTab";

export const Route = createFileRoute("/app/history")({
  head: () => ({ meta: [
    { title: "Lịch sử gợi ý — TánGPT" },
    { name: "description", content: "Xem lại những câu trả lời TánGPT từng gợi ý cho bạn." },
    { property: "og:title", content: "Lịch sử gợi ý — TánGPT" },
    { property: "og:description", content: "Xem lại những câu trả lời TánGPT từng gợi ý cho bạn." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: HistoryTab,
});
