import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/tangpt/LegalPage";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [
    { title: "Quyền riêng tư — TánGPT" },
    { name: "description", content: "Chính sách quyền riêng tư của TánGPT bằng tiếng Việt và tiếng Anh." },
    { property: "og:title", content: "Quyền riêng tư — TánGPT" },
    { property: "og:description", content: "Chính sách quyền riêng tư của TánGPT bằng tiếng Việt và tiếng Anh." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: () => <LegalPage titleVi="Chính sách quyền riêng tư" titleEn="Privacy Policy" sections={[
    { vi: { title: "1. Dữ liệu thu thập", body: "Chúng tôi lưu email, tuỳ chọn vùng miền và nội dung bạn tạo trong ứng dụng để phục vụ trải nghiệm của bạn." }, en: { title: "1. Data we collect", body: "We store your email, region preferences and the content you create in the app to power your experience." } },
    { vi: { title: "2. Mục đích sử dụng", body: "Dữ liệu chỉ dùng để vận hành và cải thiện TánGPT. Chúng tôi không bán dữ liệu cá nhân của bạn." }, en: { title: "2. How we use it", body: "Data is used only to run and improve TánGPT. We do not sell your personal data." } },
    { vi: { title: "3. Lưu trữ", body: "Dữ liệu được lưu trên hạ tầng đám mây bảo mật, chỉ tài khoản của bạn mới truy cập được nội dung riêng." }, en: { title: "3. Storage", body: "Data is kept on secure cloud infrastructure and only your account can access your private content." } },
    { vi: { title: "4. Quyền của bạn", body: "Bạn có thể xóa lịch sử trong mục Tôi hoặc yêu cầu xóa tài khoản bất cứ lúc nào." }, en: { title: "4. Your rights", body: "You can clear your history from the Me page or request account deletion at any time." } },
  ]} />,
});
