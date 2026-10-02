import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { needsOnboarding } from "@/lib/tangpt-session";
import { LangToggle, useLang } from "./Language";
import { BackButton } from "./BackButton";
import { LegalFooter } from "./LegalFooter";

export function LoginPage({ initialMode = "login" }: { initialMode?: "login" | "signup" }) {
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const navigate = useNavigate();
  const { t } = useLang();

  useEffect(() => {
    let active = true;
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const zaloToken = hash.get("zalo_token");
    const zaloError = hash.get("zalo_error");
    if (zaloToken || zaloError) window.history.replaceState(null, "", window.location.pathname + window.location.search);
    if (zaloError) setError(t("Chưa đăng nhập được bằng Zalo. Bạn thử lại nhé.", "Could not sign in with Zalo. Please try again."));
    if (zaloToken) {
      setBusy(true);
      supabase.auth.verifyOtp({ token_hash: zaloToken, type: "magiclink" }).then(async ({ data, error: err }) => {
        if (!active) return;
        setBusy(false);
        if (err || !data.user) return setError(t("Chưa đăng nhập được bằng Zalo. Bạn thử lại nhé.", "Could not sign in with Zalo. Please try again."));
        await goAfterAuth(data.user.id);
      });
      return () => { active = false; };
    }
    supabase.auth.getUser().then(({ data }) => { if (active && data.user) navigate({ to: "/app", replace: true }); });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  function zalo() {
    setError("");
    if (mode === "signup" && !accepted) {
      setError(t("Bạn cần đồng ý với Điều khoản và Chính sách bảo mật để tạo tài khoản.", "You must agree to the Terms and Privacy Policy to create an account."));
      return;
    }
    window.location.href = "/api/public/auth/zalo/start";
  }

  async function goAfterAuth(userId: string) {
    const onboard = await needsOnboarding(userId);
    navigate({ to: onboard ? "/onboarding" : "/app", replace: true });
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!email.includes("@")) return setError(t("Email này chưa đúng rồi bạn ơi.", "That email doesn't look right."));
    if (password.length < 6) return setError(t("Mật khẩu cần ít nhất 6 ký tự nhé.", "Password needs at least 6 characters."));
    if (mode === "signup" && !accepted) return setError(t("Bạn cần đồng ý với Điều khoản và Chính sách bảo mật để tạo tài khoản.", "You must agree to the Terms and Privacy Policy to create an account."));
    setBusy(true);
    const result = mode === "login"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/app" } });
    setBusy(false);
    if (result.error) {
      setError(mode === "login"
        ? t("Email hoặc mật khẩu chưa đúng. Thử lại nhé.", "Wrong email or password. Please try again.")
        : t("Chưa tạo được tài khoản. Email này có thể đã được dùng.", "Could not create the account. This email may already be in use."));
      return;
    }
    if (mode === "signup" && !result.data.session) {
      setError(t("Mình đã gửi email xác nhận. Bạn kiểm tra hộp thư nhé.", "We sent a confirmation email. Please check your inbox."));
      return;
    }
    const userId = result.data.user?.id;
    if (userId) await goAfterAuth(userId);
  }

  async function google() {
    setError("");
    if (mode === "signup" && !accepted) {
      setError(t("Bạn cần đồng ý với Điều khoản và Chính sách bảo mật để tạo tài khoản.", "You must agree to the Terms and Privacy Policy to create an account."));
      return;
    }
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/login" });
    if (result.error) setError(t("Chưa kết nối được Google. Bạn thử lại nhé.", "Could not connect to Google. Please try again."));
  }

  return <main className="auth-shell">
    <Link to="/" className="brand"><span>Tán</span>GPT<i /></Link>
    <div className="auth-back"><BackButton /></div>
    <div className="auth-lang"><LangToggle /></div>
    <section className="auth-card">
      <div className="auth-mark">T</div>
      <h1>{mode === "login" ? t("Chào bạn quay lại", "Welcome back") : t("Bắt đầu thôi bạn", "Let's get started")}</h1>
      <p>{mode === "login" ? t("Vào lại cuộc trò chuyện đang hay dở.", "Pick up where you left off.") : t("Tạo tài khoản, chọn đúng vùng rồi mình tính tiếp.", "Create an account, pick your region and we'll take it from there.")}</p>
      <div className="segmented">
        <button type="button" className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>{t("Đăng nhập", "Log in")}</button>
        <button type="button" className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>{t("Đăng ký", "Sign up")}</button>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <label>Email<input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" placeholder="ban@email.com" /></label>
        <label>{t("Mật khẩu", "Password")}<div className="password-field"><input value={password} onChange={(e) => setPassword(e.target.value)} type={show ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder={t("Ít nhất 6 ký tự", "At least 6 characters")} /><button type="button" aria-label={show ? t("Ẩn mật khẩu", "Hide password") : t("Hiện mật khẩu", "Show password")} onClick={() => setShow(!show)}>{show ? <EyeOff /> : <Eye />}</button></div></label>
        {mode === "signup" && <div className="legal-consent">
          <Checkbox id="legal-consent" checked={accepted} onCheckedChange={(value) => setAccepted(value === true)} />
          <label htmlFor="legal-consent">{t("Tôi đồng ý với", "I agree to the")} <Link to="/terms" target="_blank">{t("Điều khoản sử dụng", "Terms of Service")}</Link> {t("và", "and")} <Link to="/privacy" target="_blank">{t("Chính sách bảo mật", "Privacy Policy")}</Link></label>
        </div>}
        {error && <p className="form-message">{error}</p>}
        <div className="anchored-actions"><Button variant="gradient" size="lg" className="w-full" disabled={busy || (mode === "signup" && !accepted)}>{busy && <LoaderCircle className="animate-spin" />}{mode === "login" ? t("Đăng nhập", "Log in") : t("Tạo tài khoản", "Create account")}</Button></div>
      </form>
      <div className="divider"><span>{t("hoặc", "or")}</span></div>
      <Button variant="outline" size="lg" className="w-full" onClick={google} disabled={mode === "signup" && !accepted}><b className="google-g">G</b> {t("Tiếp tục với Google", "Continue with Google")}</Button>
      <Button variant="outline" size="lg" className="w-full mt-3" onClick={zalo} disabled={busy || (mode === "signup" && !accepted)}><b className="google-g">Z</b> {t("Đăng nhập với Zalo", "Sign in with Zalo")}</Button>
      <small>{t("Bằng việc tiếp tục, bạn đồng ý giao tiếp tử tế và tôn trọng.", "By continuing you agree to communicate kindly and respectfully.")}</small>
    </section>
    <LegalFooter />
  </main>;
}
