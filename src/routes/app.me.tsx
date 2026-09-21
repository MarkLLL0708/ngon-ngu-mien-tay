import { createFileRoute } from "@tanstack/react-router";
import { ProfileTab } from "@/components/tangpt/ProfileTab";

export const Route = createFileRoute("/app/me")({
  head: () => ({ meta: [
    { title: "Tài khoản — TánGPT" },
    { name: "description", content: "Vùng mặc định, ngôn ngữ và cài đặt tài khoản TánGPT." },
    { property: "og:title", content: "Tài khoản — TánGPT" },
    { property: "og:description", content: "Vùng mặc định, ngôn ngữ và cài đặt tài khoản TánGPT." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: ProfileTab,
});
