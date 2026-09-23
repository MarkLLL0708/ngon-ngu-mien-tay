import { createFileRoute } from "@tanstack/react-router";
import { PersonaAdminList } from "@/components/tangpt/admin/PersonaAdminList";
import { AdminGate } from "@/components/tangpt/admin/AdminGate";

export const Route = createFileRoute("/app/admin/personas/")({
  component: () => <AdminGate><PersonaAdminList /></AdminGate>,
  head: () => ({ meta: [
    { title: "Quản trị nhân vật — TánGPT" },
    { name: "description", content: "Trang quản trị nội bộ để quản lý nhân vật và media của TánGPT." },
    { property: "og:title", content: "Quản trị nhân vật — TánGPT" },
    { property: "og:description", content: "Trang quản trị nội bộ để quản lý nhân vật và media của TánGPT." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
});
