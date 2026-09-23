import { Check } from "lucide-react";
import { useLang } from "./Language";
import { GENDER_NOTE_EN, GENDER_NOTE_VI, GENDER_PAIRS, type GenderPair } from "@/lib/tangpt-gender";

export function GenderPairCards({ value, onChange }: { value: string | null; onChange: (pair: GenderPair) => void }) {
  const { t, lang } = useLang();
  return <div className="gender-pair-block">
    <div className="gender-pair-grid">
      {GENDER_PAIRS.map((pair) => <button
        type="button"
        key={pair.key}
        className={value === pair.key ? "gender-pair-card active" : "gender-pair-card"}
        aria-pressed={value === pair.key}
        onClick={() => onChange(pair)}
      >
        <strong>{lang === "en" ? pair.en : pair.vi}</strong>
        {value === pair.key && <Check size={16} />}
      </button>)}
    </div>
    <p className="gender-pair-note">{t(GENDER_NOTE_VI, GENDER_NOTE_EN)}</p>
  </div>;
}
