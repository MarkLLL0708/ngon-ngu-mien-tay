import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "./Language";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const DISMISS_KEY = "tangpt-save-account-dismissed";

export function useGuestAccount() {
  const [state, setState] = useState<{ anonymous: boolean; email: string | null }>({ anonymous: false, email: null });
  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active || !data.user) return;
      setState({ anonymous: data.user.is_anonymous === true && !data.user.email, email: data.user.email ?? null });
    });
    return () => { active = false; };
  }, []);
  return { ...state, setSaved: (email: string) => setState({ anonymous: false, email }) };
}

export function useSignInInstead() {
  const { t } = useLang();
  const navigate = useNavigate();
  return async function signInInstead() {
    const ok = window.confirm(t(
      "Dữ liệu khách hiện tại sẽ không được giữ nếu bạn chưa lưu tài khoản.",
      "Your current guest data will not be kept unless you saved your account."));
    if (!ok) return;
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };
}

export function SaveAccountBanner({ onOpen }: { onOpen: () => void }) {
  const { t } = useLang();
  const [hidden, setHidden] = useState(true);
  useEffect(() => { setHidden(window.localStorage.getItem(DISMISS_KEY) === "1"); }, []);
  if (hidden) return null;
  return <div className="save-banner">
    <ShieldCheck />
    <p>{t("Lưu tài khoản để giữ lại lịch sử trò chuyện và ký ức", "Save your account to keep your chats and memories")}</p>
    <Button variant="gradient" size="sm" onClick={onOpen}>{t("Lưu", "Save")}</Button>
    <button type="button" aria-label={t("Ẩn", "Dismiss")} onClick={() => { window.localStorage.setItem(DISMISS_KEY, "1"); setHidden(true); }}><X /></button>
  </div>;
}

export function SaveAccountModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: (email: string) => void }) {
  const { t } = useLang();
  const signInInstead = useSignInInstead();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!open) return null;

  async function save() {
    setError("");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { setError(t("Email chưa hợp lệ.", "That email is not valid.")); return; }
    if (password.length < 6) { setError(t("Mật khẩu cần ít nhất 6 ký tự.", "Password needs at least 6 characters.")); return; }
    setBusy(true);
    const { error: err } = await supabase.auth.updateUser({ email, password });
    setBusy(false);
    if (err) { setError(err.message); return; }
    toast.success(t("Đã lưu tài khoản", "Account saved"));
    onSaved(email);
    onClose();
  }

  return <div className="modal-backdrop" onClick={onClose}>
    <div className="modal-card fade-up" onClick={(e) => e.stopPropagation()}>
      <h2>{t("Lưu tài khoản", "Save your account")}</h2>
      <p>{t("Giữ lại lịch sử trò chuyện và ký ức của bạn.", "Keep your chats and memories.")}</p>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@vidu.com" />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t("Mật khẩu", "Password")} />
      {error && <small className="form-error">{error}</small>}
      <div className="anchored-actions">
        <Button variant="gradient" size="lg" disabled={busy} onClick={() => void save()}>{t("Lưu tài khoản", "Save account")}</Button>
        <button type="button" className="link-btn" onClick={() => void signInInstead()}>{t("Đã có tài khoản? Đăng nhập", "Already have an account? Log in")}</button>
      </div>
    </div>
  </div>;
}
