import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/tangpt/LegalPage";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [
    { title: "Điều khoản sử dụng — TánGPT" },
    { name: "description", content: "Điều khoản sử dụng TánGPT bằng tiếng Việt và tiếng Anh." },
    { property: "og:title", content: "Điều khoản sử dụng — TánGPT" },
    { property: "og:description", content: "Điều khoản sử dụng TánGPT bằng tiếng Việt và tiếng Anh." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: () => <LegalPage titleVi="Điều khoản sử dụng" titleEn="Terms of Use" sections={[
    { vi: { title: "1. Độ tuổi", body: "TánGPT dành cho người dùng từ 18 tuổi trở lên. Bạn xác nhận đủ tuổi khi tạo tài khoản." }, en: { title: "1. Age", body: "TánGPT is for users aged 18 and over. You confirm your age when creating an account." } },
    { vi: { title: "2. Nhân vật AI", body: "Mọi nhân vật trong ứng dụng đều do AI tạo ra, không phải người thật, và chỉ nhằm mục đích giải trí và luyện tập giao tiếp." }, en: { title: "2. AI characters", body: "All characters in the app are AI generated, not real people, and exist for entertainment and conversation practice only." } },
    { vi: { title: "3. Cách dùng phù hợp", body: "Không dùng TánGPT để quấy rối, lừa dối hay gây hại cho người khác. Chúng tôi có thể tạm dừng tài khoản vi phạm." }, en: { title: "3. Acceptable use", body: "Do not use TánGPT to harass, deceive or harm anyone. Accounts that break these rules may be suspended." } },
    { vi: { title: "4. Thay đổi điều khoản", body: "Điều khoản có thể được cập nhật. Bản mới sẽ được đăng tại trang này." }, en: { title: "4. Changes", body: "These terms may be updated. Any new version will be posted on this page." } },
  ]} />,
});
