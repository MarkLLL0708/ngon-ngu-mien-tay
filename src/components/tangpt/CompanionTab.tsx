import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PersonaCard } from "./PersonaCard";
import { useRegionTheme } from "./RegionTheme";
import { useLang } from "./Language";
import { personas, type Persona } from "@/lib/tangpt-data";
import { readReplyLanguage, saveReplyLanguage, useProfile } from "@/lib/tangpt-profile";
import type { ReplyLanguage } from "@/lib/tangpt-api";
import { supabase } from "@/integrations/supabase/client";

type CompanionRow = { id: string; name: string; personality: string; mode: string; created_at: string };

export function CompanionTab() {
  const { region } = useRegionTheme();
  const { t } = useLang();
  const profile = useProfile();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Persona | null>(null);
  const [rows, setRows] = useState<CompanionRow[]>([]);
  const [personality, setPersonality] = useState("Dịu dàng");
  const [chatLanguage, setChatLanguage] = useState<ReplyLanguage>("vi");
  const [mode, setMode] = useState("Trò chuyện");
  const [saving, setSaving] = useState(false);
  const filtered = useMemo(() => personas.filter((p) => p.region === region), [region]);

  useEffect(() => { setChatLanguage(readReplyLanguage()); }, []);
  useEffect(() => {
    if (!profile?.userId) return;
    let active = true;
    supabase.from("companions").select("id, name, personality, mode, created_at").order("created_at", { ascending: false })
      .then(({ data }) => { if (active && data) setRows(data as CompanionRow[]); });
    return () => { active = false; };
  }, [profile?.userId]);

  async function start() {
    if (!selected || !profile?.userId || saving) return;
    setSaving(true);
    saveReplyLanguage(chatLanguage);
    const { data, error } = await supabase.from("companions").insert({
      user_id: profile.userId, name: selected.name, region: selected.region,
      age_vibe: `${selected.age}`, personality, mode,
    }).select("id").single();
    setSaving(false);
    if (error || !data) return;
    navigate({ to: "/app/chat/$companionId", params: { companionId: data.id } });
  }

  return <section className="tab-page">
    {rows.length > 0 && <>
      <div className="page-title"><span>{t("CUỘC TRÒ CHUYỆN", "CONVERSATIONS")}</span><h1>{t("Bạn gái AI", "AI girlfriend")}</h1></div>
      <div className="chat-list">{rows.map((row) => <button type="button" key={row.id} onClick={() => navigate({ to: "/app/chat/$companionId", params: { companionId: row.id } })}>
        <div className="avatar-orbit small"><span>{row.name[0]}</span></div>
        <div><strong>{row.name}</strong><p>{row.personality} · {row.mode}</p></div>
        <time>{new Date(row.created_at).toLocaleDateString("vi-VN")}</time>
      </button>)}</div>
    </>}
    <div className="page-title"><span>{t("TRÒ CHUYỆN TỰ NHIÊN", "NATURAL CONVERSATION")}</span><h1>{t("Chọn người bạn trò chuyện", "Choose who you chat with")}</h1><p>{t("Cứ là chính mình. Đây là không gian để bạn trò chuyện và luyện tập.", "Just be yourself. This is a space to chat and practise.")}</p></div>
    <div className="persona-grid">{filtered.map((p) => <PersonaCard key={p.id} persona={p} selected={selected?.id === p.id} onSelect={() => setSelected(p)} />)}</div>
    {selected && <div className="confirm-sheet fade-up">
      <div className="sheet-handle" />
      <div className="flex items-center gap-3"><div className="avatar-orbit small"><span>{selected.name[0]}</span></div><div><h2>{selected.name}, {selected.age}</h2><p>{selected.job} · {selected.city}</p></div></div>
      <label>{t("Tính cách", "Personality")}</label>
      <div className="flex flex-wrap gap-2">{["Dịu dàng", "Tinh nghịch", "Chín chắn"].map((x) => <button type="button" key={x} className={personality === x ? "chip chip-active" : "chip"} onClick={() => setPersonality(x)}>{x}</button>)}</div>
      <label>{t("Ngôn ngữ trò chuyện", "Chat language")}</label>
      <div className="flex flex-wrap gap-2">{([["vi", "Tiếng Việt"], ["en", "English"], ["both", t("Song ngữ", "Bilingual")]] as [ReplyLanguage, string][]).map(([value, label]) =>
        <button type="button" key={value} className={chatLanguage === value ? "chip chip-active" : "chip"} onClick={() => setChatLanguage(value)}>{label}</button>)}</div>
      <label>{t("Chế độ", "Mode")}</label>
      <div className="segmented">
        <button type="button" className={mode === "Trò chuyện" ? "active" : ""} onClick={() => setMode("Trò chuyện")}>{t("Trò chuyện", "Chat")}</button>
        <button type="button" className={mode !== "Trò chuyện" ? "active" : ""} onClick={() => setMode("Luyện tập tán tỉnh")}>{t("Luyện tập tán tỉnh", "Flirting practice")}</button>
      </div>
      <Button variant="gradient" size="lg" onClick={start} disabled={saving}>{saving ? <LoaderCircle className="animate-spin" /> : null}{t("Bắt đầu nhắn tin", "Start chatting")}</Button>
    </div>}
  </section>;
}
