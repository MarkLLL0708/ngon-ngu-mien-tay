import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useLang } from "./Language";
import { startCompanion, type PersonaRow } from "@/lib/tangpt-personas";
import { readReplyLanguage, saveReplyLanguage, useProfile } from "@/lib/tangpt-profile";
import type { ReplyLanguage } from "@/lib/tangpt-api";

export function PersonaCustomizeSheet({ persona, preview, onClose }: { persona: PersonaRow; preview?: boolean; onClose: () => void }) {
  const { t } = useLang();
  const navigate = useNavigate();
  const profile = useProfile();
  const [personality, setPersonality] = useState(persona.personality || "Dịu dàng");
  const [personaStyle, setPersonaStyle] = useState("Nhẹ nhàng");
  const [pair, setPair] = useState<[string, string]>(["mình", "bạn"]);
  const [chatLanguage, setChatLanguage] = useState<ReplyLanguage>("vi");
  const [busy, setBusy] = useState(false);

  useEffect(() => { setChatLanguage(readReplyLanguage()); }, []);

  async function start() {
    if (preview || busy || !profile?.userId) return;
    setBusy(true);
    saveReplyLanguage(chatLanguage);
    try {
      const id = await startCompanion(profile.userId, persona, {
        personality, personaStyle, chatLanguage, addressSelf: pair[0], addressOther: pair[1],
      });
      navigate({ to: "/app/chat/$companionId", params: { companionId: id } });
    } finally { setBusy(false); }
  }

  return <div className="sheet-backdrop" onClick={onClose}>
    <div className="confirm-sheet" onClick={(event) => event.stopPropagation()}>
      <div className="confirm-sheet-body">
        <div className="sheet-handle" />
        <h2>{t("Tùy chỉnh", "Customise")}</h2>
        <label>{t("Tính cách", "Personality")}</label>
        <div className="flex flex-wrap gap-2">{["Dịu dàng", "Tinh nghịch", "Chín chắn"].map((x) =>
          <button type="button" key={x} className={personality === x ? "chip chip-active" : "chip"} onClick={() => setPersonality(x)}>{x}</button>)}</div>
        <label>{t("Phong cách", "Style")}</label>
        <div className="flex flex-wrap gap-2">{["Nhẹ nhàng", "Cá tính"].map((x) =>
          <button type="button" key={x} className={personaStyle === x ? "chip chip-active" : "chip"} onClick={() => setPersonaStyle(x)}>{x}</button>)}</div>
        <label>{t("Cách xưng hô", "Address pair")}</label>
        <div className="flex flex-wrap gap-2">{([["mình", "bạn"], ["em", "anh"], ["anh", "em"], ["tớ", "cậu"]] as [string, string][]).map(([self, other]) =>
          <button type="button" key={`${self}-${other}`} className={pair[0] === self && pair[1] === other ? "chip chip-active" : "chip"} onClick={() => setPair([self, other])}>{self} - {other}</button>)}</div>
        <label>{t("Ngôn ngữ trò chuyện", "Chat language")}</label>
        <div className="flex flex-wrap gap-2">{([["vi", "Tiếng Việt"], ["en", "English"], ["both", t("Song ngữ", "Bilingual")]] as [ReplyLanguage, string][]).map(([value, label]) =>
          <button type="button" key={value} className={chatLanguage === value ? "chip chip-active" : "chip"} onClick={() => setChatLanguage(value)}>{label}</button>)}</div>
      </div>
      <div className="anchored-actions">
        <Button variant="gradient" className="w-full" disabled={busy || preview} onClick={start}>{t("Bắt đầu nhắn tin", "Start chatting")}</Button>
      </div>
    </div>
  </div>;
}
