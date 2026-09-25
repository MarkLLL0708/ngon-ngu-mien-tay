import { Link } from "@tanstack/react-router";
import { useLang } from "./Language";

export function LegalFooter({ compact = false }: { compact?: boolean }) {
  const { t } = useLang();
  return <footer className={compact ? "app-legal-footer compact" : "app-legal-footer"}>
    <Link to="/terms">{t("Điều khoản sử dụng", "Terms of Service")}</Link>
    <Link to="/privacy">{t("Chính sách bảo mật", "Privacy Policy")}</Link>
  </footer>;
}