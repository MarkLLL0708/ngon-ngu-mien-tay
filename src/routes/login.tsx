import { createFileRoute } from "@tanstack/react-router";
import { LoginPage } from "@/components/tangpt/LoginPage";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): { mode?: "login" | "signup" } =>
    search['mode'] === "signup" ? { mode: "signup" } : {},
  head: () => ({ meta: [
    { title: "Đăng nhập — TánGPT" },
    { name: "description", content: "Đăng nhập hoặc tạo tài khoản TánGPT." },
    { property: "og:title", content: "Đăng nhập — TánGPT" },
    { property: "og:description", content: "Bắt đầu nhắn tin duyên dáng, đúng chất vùng miền." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: LoginRoute,
});

function LoginRoute() {
  const { mode } = Route.useSearch();
  return <LoginPage initialMode={mode ?? "login"} />;
}
