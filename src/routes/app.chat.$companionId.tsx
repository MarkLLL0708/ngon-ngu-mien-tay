import { createFileRoute } from "@tanstack/react-router";
import { ChatScreen } from "@/components/tangpt/ChatScreen";

export const Route = createFileRoute("/app/chat/$companionId")({
  component: ChatRoute,
  head: () => ({
    meta: [
      { title: "Trò chuyện cùng bạn gái AI | TánGPT" },
      { name: "description", content: "Nhắn tin tự nhiên với nhân vật AI của bạn trên TánGPT." },
      { property: "og:title", content: "Trò chuyện cùng bạn gái AI | TánGPT" },
      { property: "og:description", content: "Nhắn tin tự nhiên với nhân vật AI của bạn trên TánGPT." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function ChatRoute() {
  const { companionId } = Route.useParams();
  return <ChatScreen companionId={companionId} />;
}
