import { LangToggle, useLang } from "./Language";
import { BackButton } from "./BackButton";
import { Link } from "@tanstack/react-router";

export type LegalSection = { vi: { title: string; body: string[] }; en: { title: string; body: string[] } };

export function LegalPage({ titleVi, titleEn, sections }: { titleVi: string; titleEn: string; sections: LegalSection[] }) {
  const { lang, t } = useLang();
  const title = lang === "vi" ? titleVi : titleEn;
  return <main className="legal-shell">
    <header>
      <div className="nav-side"><BackButton label={t("Quay lại", "Back")} /><Link to="/" className="brand"><span>Tán</span>GPT<i /></Link></div>
      <LangToggle />
    </header>
    <article>
      <h1>{title}</h1>
      <div className="legal-review" role="status">[CẦN LUẬT SƯ XEM LẠI] / [NEEDS LAWYER REVIEW]</div>
      <p className="legal-note">{t("Bản dự thảo này cần được luật sư có chuyên môn xem xét trước khi sử dụng chính thức.", "This draft must be reviewed by qualified legal counsel before official use.")}</p>
      {sections.map((section) => <section key={section.en.title}>
        <h2>{lang === "vi" ? section.vi.title : section.en.title}</h2>
        {(lang === "vi" ? section.vi.body : section.en.body).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </section>)}
    </article>
    <footer className="legal-page-footer"><Link to="/terms">{t("Điều khoản sử dụng", "Terms of Service")}</Link><Link to="/privacy">{t("Chính sách bảo mật", "Privacy Policy")}</Link></footer>
  </main>;
}
