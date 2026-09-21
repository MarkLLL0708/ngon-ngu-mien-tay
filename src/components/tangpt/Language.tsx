import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Lang = "vi" | "en";
type LanguageContextValue = { lang: Lang; setLang: (lang: Lang) => void; t: (vi: string, en: string) => string };
const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("vi");
  useEffect(() => {
    const saved = window.localStorage.getItem("tangpt-lang");
    if (saved === "vi" || saved === "en") setLangState(saved);
  }, []);
  const value = useMemo<LanguageContextValue>(() => ({
    lang,
    setLang: (next: Lang) => { setLangState(next); window.localStorage.setItem("tangpt-lang", next); },
    t: (vi: string, en: string) => (lang === "vi" ? vi : en),
  }), [lang]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useLang phải nằm trong LanguageProvider");
  return value;
}

export function LangToggle() {
  const { lang, setLang } = useLang();
  return <div className="lang-toggle">
    <button type="button" className={lang === "vi" ? "active" : ""} onClick={() => setLang("vi")}>VI</button>
    <span>|</span>
    <button type="button" className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>EN</button>
  </div>;
}
