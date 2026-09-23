import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Trash2 } from "lucide-react";
import { useRegionTheme } from "./RegionTheme";
import { LangToggle, useLang } from "./Language";
import { RegionPicker } from "./RegionPicker";
import { SaveAccountBanner, SaveAccountModal, useGuestAccount, useSignInInstead } from "./SaveAccount";
import { regions } from "@/lib/tangpt-data";
import { readReplyLanguage, saveReplyLanguage, useProfile } from "@/lib/tangpt-profile";
import type { ReplyLanguage } from "@/lib/tangpt-api";
import { supabase } from "@/integrations/supabase/client";
import { TEST_GUEST_MODE } from "@/lib/tangpt-config";
import { resetGuestSession } from "@/lib/tangpt-guest";

export function ProfileTab() {
  const { region, city } = useRegionTheme();
  const { t } = useLang();
  const navigate = useNavigate();
  const profile = useProfile();
  const guest = useGuestAccount();
  const signInInstead = useSignInInstead();
  const [saveOpen, setSaveOpen] = useState(false);
  const [replyLanguage, setReplyLanguage] = useState<ReplyLanguage>("vi");
  const [cleared, setCleared] = useState(false);
  const [pairKey, setPairKey] = useState<string | null>(null);

  useEffect(() => { setReplyLanguage(readReplyLanguage()); }, []);
  useEffect(() => { if (profile) setPairKey(pairOf(profile.gender, profile.targetGender)?.key ?? null); }, [profile]);

  // Applies straight away to persona filtering and reply-helper prefills; existing chats keep their own framing.
  function choosePair(pair: GenderPair) {
    setPairKey(pair.key);
    const [self, other] = defaultAddress(pair.user, pair.target);
    window.localStorage.setItem("tangpt-address-self", self);
    window.localStorage.setItem("tangpt-address-other", other);
    if (profile?.userId) void saveGenderPair(profile.userId, pair);
  }


  async function logout() { await supabase.auth.signOut(); navigate({ to: "/", replace: true }); }

  async function resetSession() { await resetGuestSession(); navigate({ to: "/onboarding", replace: true }); }

  async function clearHistory() {
    window.localStorage.removeItem("tangpt-history");
    if (profile?.userId) await supabase.from("reply_generations").delete().eq("user_id", profile.userId);
    setCleared(true); window.setTimeout(() => setCleared(false), 2000);
  }

  function pickLanguage(value: ReplyLanguage) { setReplyLanguage(value); saveReplyLanguage(value); }

  const plan = profile?.plan === "pro" ? "Pro" : t("Miễn phí", "Free");
  return <section className="tab-page">
    {guest.anonymous && <SaveAccountBanner onOpen={() => setSaveOpen(true)} />}
    <SaveAccountModal open={saveOpen} onClose={() => setSaveOpen(false)} onSaved={(email) => guest.setSaved(email)} />
    <div className="page-title"><span>{t("TÀI KHOẢN CỦA BẠN", "YOUR ACCOUNT")}</span><h1>{t("Tôi", "Me")}</h1>{TEST_GUEST_MODE && <b className="ai-badge">{t("Chế độ thử nghiệm", "Test mode")}</b>}</div>
    <div className="profile-hero"><div className="avatar-orbit"><span>B</span></div><div><strong>{guest.email ?? t("Bạn của TánGPT", "TánGPT friend")}</strong><p>{t("Gói", "Plan")} <b>{plan}</b></p></div></div>
    <div className="settings-list">
      <div className="settings-wide">
        <span>{t("Bạn muốn kết nối như thế nào?", "How do you want to connect?")}</span>
        <GenderPairCards value={pairKey} onChange={choosePair} />
      </div>
      <div><span>{t("Vùng & thành phố", "Region & city")}</span><b>{regions[region].name} · {city}</b></div>
      <div className="settings-wide"><RegionPicker compact /></div>
      <div><span>{t("Ngôn ngữ ứng dụng", "App language")}</span><LangToggle /></div>

      <div className="settings-wide">
        <span>{t("Ngôn ngữ trả lời mặc định", "Default reply language")}</span>
        <div className="flex flex-wrap gap-2">{([["vi", "Tiếng Việt"], ["en", "English"], ["both", t("Song ngữ", "Bilingual")]] as [ReplyLanguage, string][]).map(([value, label]) =>
          <button type="button" key={value} className={replyLanguage === value ? "chip chip-active" : "chip"} onClick={() => pickLanguage(value)}>{label}</button>)}</div>
      </div>
      <div><span>{t("Trạng thái", "Status")}</span><b className="text-primary">{plan}</b></div>
      <button type="button" onClick={clearHistory}><Trash2 />{cleared ? t("Đã xóa", "Cleared") : t("Xóa lịch sử trò chuyện", "Clear conversation history")}</button>
      {TEST_GUEST_MODE && guest.anonymous
        ? <button type="button" onClick={resetSession}><LogOut />{t("Đặt lại phiên thử nghiệm", "Reset test session")}</button>
        : <button type="button" onClick={logout}><LogOut />{t("Đăng xuất", "Log out")}</button>}
    </div>
    <button type="button" className="link-btn" onClick={() => void signInInstead()}>{t("Đã có tài khoản? Đăng nhập", "Already have an account? Log in")}</button>
    <div className="legal-links"><Link to="/terms">{t("Điều khoản", "Terms")}</Link><Link to="/privacy">{t("Quyền riêng tư", "Privacy")}</Link></div>
  </section>;
}
