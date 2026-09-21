import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Trash2 } from "lucide-react";
import { useRegionTheme } from "./RegionTheme";
import { LangToggle, useLang } from "./Language";
import { regions } from "@/lib/tangpt-data";
import { supabase } from "@/integrations/supabase/client";

export function ProfileTab() {
  const { region, city } = useRegionTheme();
  const { t } = useLang();
  const navigate = useNavigate();
  async function logout() { await supabase.auth.signOut(); navigate({ to: "/", replace: true }); }
  return <section className="tab-page">
    <div className="page-title"><span>{t("TÀI KHOẢN CỦA BẠN", "YOUR ACCOUNT")}</span><h1>{t("Tôi", "Me")}</h1></div>
    <div className="profile-hero"><div className="avatar-orbit"><span>B</span></div><div><strong>{t("Bạn của TánGPT", "TánGPT friend")}</strong><p>{t("Gói", "Plan")} <b>{t("Miễn phí", "Free")}</b></p></div></div>
    <div className="settings-list">
      <div><span>{t("Vùng mặc định", "Default region")}</span><b>{regions[region].name} · {city}</b></div>
      <div><span>{t("Ngôn ngữ", "Language")}</span><LangToggle /></div>
      <div><span>{t("Trạng thái", "Status")}</span><b className="text-primary">{t("Miễn phí", "Free")}</b></div>
      <button type="button" onClick={() => { window.localStorage.removeItem("tangpt-history"); }}><Trash2 />{t("Xóa lịch sử trò chuyện", "Clear conversation history")}</button>
      <button type="button" onClick={logout}><LogOut />{t("Đăng xuất", "Log out")}</button>
    </div>
    <div className="legal-links"><Link to="/terms">{t("Điều khoản", "Terms")}</Link><Link to="/privacy">{t("Quyền riêng tư", "Privacy")}</Link></div>
  </section>;
}
