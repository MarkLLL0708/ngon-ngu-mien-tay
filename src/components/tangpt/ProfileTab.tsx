import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Trash2 } from "lucide-react";
import { useRegionTheme } from "./RegionTheme";
import { LangToggle, useLang } from "./Language";
import { RegionPicker } from "./RegionPicker";
import { SaveAccountBanner, SaveAccountModal, useGuestAccount, useSignInInstead } from "./SaveAccount";
import { GenderPairCards } from "./GenderPairCards";
import { defaultAddress, pairOf, saveGenderPair, type GenderPair } from "@/lib/tangpt-gender";

import { regions } from "@/lib/tangpt-data";
import { readReplyLanguage, saveReplyLanguage, useProfile } from "@/lib/tangpt-profile";
import type { ReplyLanguage } from "@/lib/tangpt-api";
import { supabase } from "@/integrations/supabase/client";
import { TEST_GUEST_MODE } from "@/lib/tangpt-config";
import { resetGuestSession } from "@/lib/tangpt-guest";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { deleteMyAccount } from "@/lib/account.functions";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  const [deleting, setDeleting] = useState(false);
  const deleteAccount = useServerFn(deleteMyAccount);

  useEffect(() => { setReplyLanguage(readReplyLanguage()); }, []);
  useEffect(() => { if (profile) setPairKey(pairOf(profile.gender, profile.targetGender)?.key ?? null); }, [profile]);

  // Applies straight away to persona filtering and reply-helper prefills; existing chats keep their own framing.
  async function choosePair(pair: GenderPair) {
    const previousKey = pairKey;
    setPairKey(pair.key);
    const [self, other] = defaultAddress(pair.user, pair.target);
    window.localStorage.setItem("tangpt-address-self", self);
    window.localStorage.setItem("tangpt-address-other", other);
    if (!profile?.userId) {
      setPairKey(previousKey);
      toast.error(t("Không thể cập nhật", "Could not update"));
      return;
    }
    try {
      await saveGenderPair(profile.userId, pair);
      toast.success(t("Đã cập nhật", "Updated"));
    } catch {
      setPairKey(previousKey);
      toast.error(t("Không thể cập nhật", "Could not update"));
    }
  }


  async function logout() { await supabase.auth.signOut(); navigate({ to: "/", replace: true }); }

  async function resetSession() { await resetGuestSession(); navigate({ to: "/onboarding", replace: true }); }

  async function clearHistory() {
    window.localStorage.removeItem("tangpt-history");
    if (profile?.userId) await supabase.from("reply_generations").delete().eq("user_id", profile.userId);
    setCleared(true); window.setTimeout(() => setCleared(false), 2000);
  }

  async function permanentlyDeleteAccount() {
    setDeleting(true);
    try {
      await deleteAccount();
      await supabase.auth.signOut();
      for (const key of Object.keys(window.localStorage)) {
        if (key.startsWith("tangpt-")) window.localStorage.removeItem(key);
      }
      navigate({ to: "/", replace: true });
      toast.success(t("Tài khoản và dữ liệu đã được xóa", "Account and data deleted"));
    } catch {
      setDeleting(false);
      toast.error(t("Chưa thể xóa tài khoản. Vui lòng thử lại.", "Could not delete the account. Please try again."));
    }
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
      <AlertDialog>
        <AlertDialogTrigger asChild><button type="button" className="danger-setting"><Trash2 />{t("Xóa tài khoản và dữ liệu", "Delete account and data")}</button></AlertDialogTrigger>
        <AlertDialogContent className="glass-sheet">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Xóa vĩnh viễn tài khoản?", "Permanently delete your account?")}</AlertDialogTitle>
            <AlertDialogDescription>{t("Hồ sơ, nhân vật đồng hành, lịch sử trò chuyện và ký ức của bạn sẽ bị xóa vĩnh viễn. Không thể hoàn tác.", "Your profile, companions, chat history, and memories will be permanently deleted. This cannot be undone.")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t("Hủy", "Cancel")}</AlertDialogCancel>
            <AlertDialogAction asChild><Button variant="destructive" disabled={deleting} onClick={() => void permanentlyDeleteAccount()}>{deleting ? t("Đang xóa...", "Deleting...") : t("Xóa tài khoản và dữ liệu", "Delete account and data")}</Button></AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    <button type="button" className="link-btn" onClick={() => void signInInstead()}>{t("Đã có tài khoản? Đăng nhập", "Already have an account? Log in")}</button>
    <div className="legal-links"><Link to="/">{t("Trang chủ", "Home")}</Link><Link to="/terms">{t("Điều khoản", "Terms")}</Link><Link to="/privacy">{t("Quyền riêng tư", "Privacy")}</Link></div>
  </section>;
}
