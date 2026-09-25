import { createFileRoute } from "@tanstack/react-router";
import { SuggestTab } from "@/components/tangpt/SuggestTab";
import { CompanionTab } from "@/components/tangpt/CompanionTab";
import { REPLY_HELPER_ENABLED } from "@/lib/tangpt-config";

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [
    { title: "Người bạn AI — TánGPT" },
    { name: "description", content: "Trò chuyện với người bạn AI hiểu vùng miền, cảm xúc và những điều quan trọng với bạn." },
    { property: "og:title", content: "Người bạn AI — TánGPT" },
    { property: "og:description", content: "Người bạn AI nhớ bạn và trò chuyện đúng chất vùng miền Việt Nam." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: REPLY_HELPER_ENABLED ? SuggestTab : CompanionTab,
});
