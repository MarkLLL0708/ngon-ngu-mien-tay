import { LangToggle } from "./Language";
import { BackButton } from "./BackButton";

export type LegalSection = { vi: { title: string; body: string }; en: { title: string; body: string } };

export function LegalPage({ titleVi, titleEn, sections }: { titleVi: string; titleEn: string; sections: LegalSection[] }) {
  return <main className="legal-shell">
    <header>
      <BackButton label="Trang chủ / Home" />
      <LangToggle />
    </header>
    <article>
      <h1>{titleVi} <span>/ {titleEn}</span></h1>
      <p className="legal-note">Nội dung mẫu, chưa phải văn bản pháp lý chính thức. — Placeholder text, not final legal wording.</p>
      {sections.map((section) => <section key={section.en.title}>
        <h2>{section.vi.title} <span>/ {section.en.title}</span></h2>
        <p>{section.vi.body}</p>
        <p className="legal-en">{section.en.body}</p>
      </section>)}
    </article>
  </main>;
}
