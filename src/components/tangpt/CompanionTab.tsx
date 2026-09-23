import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { LoaderCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PersonaCard } from "./PersonaCard";
import { RegionChipBar } from "./RegionChipBar";
import { useRegionTheme } from "./RegionTheme";
import { useLang } from "./Language";
import { SaveAccountBanner, SaveAccountModal, useGuestAccount } from "./SaveAccount";
import { personas, type Persona } from "@/lib/tangpt-data";
import { readReplyLanguage, saveReplyLanguage, useProfile } from "@/lib/tangpt-profile";
import type { ReplyLanguage } from "@/lib/tangpt-api";
import { supabase } from "@/integrations/supabase/client";
import { companionGenderMix, listTitle, relativeTime, useCompanions } from "@/lib/tangpt-companions";

export function CompanionTab() {
  const { region } = useRegionTheme();
  const { t, lang } = useLang();
  const profile = useProfile();
  const navigate = useNavigate();
  const { rows } = useCompanions();
  const guest = useGuestAccount();
  const [saveOpen, setSaveOpen] = useState(false);
  const [selected, setSelected] = useState<Persona | null>(null);
  const [adding, setAdding] = useState(false);
  const [personality, setPersonality] = useState("Dịu dàng");
  const [chatLanguage, setChatLanguage] = useState<ReplyLanguage>("vi");
  const [mode, setMode] = useState("Trò chuyện");
  const [personaStyle, setPersonaStyle] = useState("Nhẹ nhàng");
  const [pair, setPair] = useState<[string, string]>(["mình", "bạn"]);
  const [saving, setSaving] = useState(false);
  const filtered = useMemo(() => personas.filter((p) => p.region === region), [region]);

  useEffect(() => { setChatLanguage(readReplyLanguage()); }, []);

  const list = rows ?? [];
  const hasCompanions = list.length > 0;
  const mix = companionGenderMix(list.map((row) => row.persona_gender));
  const vi = lang === "vi";
  const showPicker = !hasCompanions || adding;

  async function start() {
    if (!selected || !profile?.userId || saving) return;
    setSaving(true);
    saveReplyLanguage(chatLanguage);
    const { data, error } = await supabase.from("companions").insert({
      user_id: profile.userId, name: selected.name, region: selected.region,
      age_vibe: `${selected.age}`, personality, mode,
      city: selected.city, job: selected.job, chat_language: chatLanguage,
      persona_gender: "female", persona_style: personaStyle,
      address_self: pair[0], address_other: pair[1],
    }).select("id").single();
    setSaving(false);
    if (error || !data) return;
    navigate({ to: "/app/chat/$companionId", params: { companionId: data.id } });
  }

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
      <div className="page-title"><span>{t("TRÒ CHUYỆN TỰ NHIÊN", "NATURAL CONVERSATION")}</span><h1>{t("Chọn người bạn trò chuyện", "Choose who you chat with")}</h1><p>{t("Cứ là chính mình. Đây là không gian để bạn trò chuyện và luyện tập.", "Just be yourself. This is a space to chat and practise.")}</p></div>
      {!hasCompanions && <RegionChipBar />}
      <div className="persona-grid">{filtered.map((p) => <PersonaCard key={p.id} persona={p} selected={selected?.id === p.id} onSelect={() => setSelected(p)} />)}</div>
    </>}

    {showPicker && selected && <div className="confirm-sheet">
      <div className="confirm-sheet-body">
      <div className="sheet-handle" />
      <div className="flex items-center gap-3"><div className="avatar-orbit small"><span>{selected.name[0]}</span></div><div><h2>{selected.name}, {selected.age}</h2><p>{selected.job} · {selected.city}</p></div></div>
      <label>{t("Tính cách", "Personality")}</label>
      <div className="flex flex-wrap gap-2">{["Dịu dàng", "Tinh nghịch", "Chín chắn"].map((x) => <button type="button" key={x} className={personality === x ? "chip chip-active" : "chip"} onClick={() => setPersonality(x)}>{x}</button>)}</div>
      <label>{t("Phong cách", "Style")}</label>
      <div className="flex flex-wrap gap-2">{["Nhẹ nhàng", "Cá tính"].map((x) => <button type="button" key={x} className={personaStyle === x ? "chip chip-active" : "chip"} onClick={() => setPersonaStyle(x)}>{x}</button>)}</div>
      <label>{t("Cách xưng hô", "Address pair")}</label>
      <div className="flex flex-wrap gap-2">{([["mình", "bạn"], ["em", "anh"], ["anh", "em"], ["tớ", "cậu"]] as [string, string][]).map(([self, other]) =>
        <button type="button" key={`${self}-${other}`} className={pair[0] === self && pair[1] === other ? "chip chip-active" : "chip"} onClick={() => setPair([self, other])}>{self} - {other}</button>)}</div>
      <label>{t("Ngôn ngữ trò chuyện", "Chat language")}</label>
      <div className="flex flex-wrap gap-2">{([["vi", "Tiếng Việt"], ["en", "English"], ["both", t("Song ngữ", "Bilingual")]] as [ReplyLanguage, string][]).map(([value, label]) =>
        <button type="button" key={value} className={chatLanguage === value ? "chip chip-active" : "chip"} onClick={() => setChatLanguage(value)}>{label}</button>)}</div>
      <label>{t("Chế độ", "Mode")}</label>
      <div className="segmented">
        <button type="button" className={mode === "Trò chuyện" ? "active" : ""} onClick={() => setMode("Trò chuyện")}>{t("Trò chuyện", "Chat")}</button>
        <button type="button" className={mode !== "Trò chuyện" ? "active" : ""} onClick={() => setMode("Luyện tập tán tỉnh")}>{t("Luyện tập tán tỉnh", "Flirting practice")}</button>
      </div>
      </div>
      <div className="anchored-actions"><Button variant="gradient" size="lg" onClick={start} disabled={saving}>{saving ? <LoaderCircle className="animate-spin" /> : null}{t("Bắt đầu nhắn tin", "Start chatting")}</Button></div>
    </div>}
  </section>;
}
