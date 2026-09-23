import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { PersonaCard } from "./PersonaCard";
import { RegionChipBar } from "./RegionChipBar";
import { useRegionTheme } from "./RegionTheme";
import { useLang } from "./Language";
import { SaveAccountBanner, SaveAccountModal, useGuestAccount } from "./SaveAccount";
import { usePublishedPersonas } from "@/lib/tangpt-personas";
import { useProfile } from "@/lib/tangpt-profile";
import { personaGenderFilter } from "@/lib/tangpt-gender";
import { relativeTime, useCompanions } from "@/lib/tangpt-companions";

export function CompanionTab() {
  const { region } = useRegionTheme();
  const { t, lang } = useLang();
  const navigate = useNavigate();
  const { rows } = useCompanions();
  const guest = useGuestAccount();
  const [saveOpen, setSaveOpen] = useState(false);
  const profile = useProfile();
  // Persona list follows the combined choice: a specific gender, or everyone when open/unspecified.
  const personas = usePublishedPersonas(region, profile ? personaGenderFilter(profile.targetGender) : null);

  const list = rows ?? [];
  const hasCompanions = list.length > 0;
  const vi = lang === "vi";
  const startedSlugs = new Set(list.map((row) => row.persona_slug).filter(Boolean));
  const availablePersonas = (personas ?? []).filter((persona) => !startedSlugs.has(persona.slug));

  return <section className="tab-page">
    {guest.anonymous && <SaveAccountBanner onOpen={() => setSaveOpen(true)} />}
    <SaveAccountModal open={saveOpen} onClose={() => setSaveOpen(false)} onSaved={(email) => guest.setSaved(email)} />

    {hasCompanions && <>
      <div className="page-title"><span>{t("CUỘC TRÒ CHUYỆN", "CONVERSATIONS")}</span><h1>{t("Cuộc trò chuyện của bạn", "Your conversations")}</h1></div>
      <div className="chat-list">{list.map((row) => <button type="button" key={row.id} onClick={() => navigate({ to: "/app/chat/$companionId", params: { companionId: row.id } })}>
        <div className="avatar-orbit small"><span>{row.name[0]}</span></div>
        <div><strong>{row.name}</strong><p>{row.last_message_preview || `${row.personality} · ${row.mode}`}</p></div>
        <time>{relativeTime(row.last_message_at ?? row.created_at, vi)}</time>
      </button>)}</div>
    </>}

    <>
      <div className="page-title">
        <span>{t("KHÁM PHÁ", "DISCOVER")}</span>
        <h1>{t("Khám phá nhân vật mới", "Discover new characters")}</h1>
        <p>{t("Cứ là chính mình. Đây là không gian để bạn trò chuyện và luyện tập.", "Just be yourself. This is a space to chat and practise.")}</p>
      </div>
      <RegionChipBar />
      {!personas && <p className="text-sm text-muted-foreground">{t("Đang tải…", "Loading…")}</p>}
      <div className="persona-grid">{availablePersonas.map((p) =>
        <PersonaCard key={p.id} persona={p} onSelect={() => navigate({ to: "/app/persona/$personaId", params: { personaId: p.id } })} />)}</div>
    </>
  </section>;
}
