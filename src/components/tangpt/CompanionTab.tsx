import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PersonaCard } from "./PersonaCard";
import { RegionChipBar } from "./RegionChipBar";
import { useRegionTheme } from "./RegionTheme";
import { useLang } from "./Language";
import { SaveAccountBanner, SaveAccountModal, useGuestAccount } from "./SaveAccount";
import { usePublishedPersonas } from "@/lib/tangpt-personas";
import { companionGenderMix, listTitle, relativeTime, useCompanions } from "@/lib/tangpt-companions";

export function CompanionTab() {
  const { region } = useRegionTheme();
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const { rows } = useCompanions();
  const guest = useGuestAccount();
  const [saveOpen, setSaveOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const personas = usePublishedPersonas(region);

  const list = rows ?? [];
  const hasCompanions = list.length > 0;
  const mix = companionGenderMix(list.map((row) => row.persona_gender));
  const vi = lang === "vi";
  const showPicker = !hasCompanions || adding;

  return <section className="tab-page">
    {guest.anonymous && <SaveAccountBanner onOpen={() => setSaveOpen(true)} />}
    <SaveAccountModal open={saveOpen} onClose={() => setSaveOpen(false)} onSaved={(email) => guest.setSaved(email)} />

    {hasCompanions && <>
      <div className="row-title">
        <div className="page-title"><span>{t("CUỘC TRÒ CHUYỆN", "CONVERSATIONS")}</span><h1>{listTitle(mix, vi)}</h1></div>
        <Button variant="gradient" size="icon" aria-label={t("Thêm nhân vật", "Add a companion")} onClick={() => setAdding((x) => !x)}><Plus /></Button>
      </div>
      <RegionChipBar />
      <div className="chat-list">{list.map((row) => <button type="button" key={row.id} onClick={() => navigate({ to: "/app/chat/$companionId", params: { companionId: row.id } })}>
        <div className="avatar-orbit small"><span>{row.name[0]}</span></div>
        <div><strong>{row.name}</strong><p>{row.last_message_preview || `${row.personality} · ${row.mode}`}</p></div>
        <time>{relativeTime(row.last_message_at ?? row.created_at, vi)}</time>
      </button>)}</div>
    </>}

    {showPicker && <>
      <div className="page-title">
        <span>{t("TRÒ CHUYỆN TỰ NHIÊN", "NATURAL CONVERSATION")}</span>
        <h1>{t("Chọn người bạn trò chuyện", "Choose who you chat with")}</h1>
        <p>{t("Cứ là chính mình. Đây là không gian để bạn trò chuyện và luyện tập.", "Just be yourself. This is a space to chat and practise.")}</p>
      </div>
      {!hasCompanions && <RegionChipBar />}
      {!personas && <p className="text-sm text-muted-foreground">{t("Đang tải…", "Loading…")}</p>}
      <div className="persona-grid">{(personas ?? []).map((p) =>
        <PersonaCard key={p.id} persona={p} onSelect={() => navigate({ to: "/app/persona/$personaId", params: { personaId: p.id } })} />)}</div>
    </>}
  </section>;
}
