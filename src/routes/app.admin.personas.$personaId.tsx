import { createFileRoute } from "@tanstack/react-router";
import { PersonaEditor } from "@/components/tangpt/admin/PersonaEditor";
import { AdminGate } from "@/components/tangpt/admin/AdminGate";

export const Route = createFileRoute("/app/admin/personas/$personaId")({
  component: EditorRoute,
  head: () => ({ meta: [
    { title: "Sửa nhân vật — TánGPT" },
    { name: "description", content: "Chỉnh sửa hồ sơ, ảnh và video giới thiệu của nhân vật TánGPT." },
    { property: "og:title", content: "Sửa nhân vật — TánGPT" },
    { property: "og:description", content: "Chỉnh sửa hồ sơ, ảnh và video giới thiệu của nhân vật TánGPT." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
});

function EditorRoute() {
  const { personaId } = Route.useParams();
  return <AdminGate><PersonaEditor personaId={personaId} /></AdminGate>;
}
