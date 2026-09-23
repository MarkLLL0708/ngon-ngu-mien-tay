import { createFileRoute } from "@tanstack/react-router";
import { PersonaIntro } from "@/components/tangpt/PersonaIntro";
import { usePersona } from "@/lib/tangpt-personas";

export const Route = createFileRoute("/app/persona/$personaId")({
  component: PersonaRoute,
  head: () => ({ meta: [
    { title: "Làm quen nhân vật AI — TánGPT" },
    { name: "description", content: "Xem giới thiệu nhân vật AI trước khi bắt đầu nhắn tin trên TánGPT." },
    { property: "og:title", content: "Làm quen nhân vật AI — TánGPT" },
    { property: "og:description", content: "Xem giới thiệu nhân vật AI trước khi bắt đầu nhắn tin trên TánGPT." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
});

function PersonaRoute() {
  const { personaId } = Route.useParams();
  const persona = usePersona(personaId);
  if (persona === undefined) return <p className="text-sm text-muted-foreground">Đang tải…</p>;
  if (!persona || !persona.published) return <p className="text-sm text-muted-foreground">Không tìm thấy nhân vật này.</p>;
  return <PersonaIntro persona={persona} />;
}
