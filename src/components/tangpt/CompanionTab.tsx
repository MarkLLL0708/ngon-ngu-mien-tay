import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PersonaCard } from "./PersonaCard";
import { useRegionTheme } from "./RegionTheme";
import { useLang } from "./Language";
import { personas, type Persona } from "@/lib/tangpt-data";

export function CompanionTab() {
  const { region } = useRegionTheme();
  const { t } = useLang();
  const [selected, setSelected] = useState<Persona | null>(null);
  const [companions, setCompanions] = useState<Persona[]>([]);
  const [personality, setPersonality] = useState("Dịu dàng");
  const [mode, setMode] = useState("Trò chuyện");
  const navigate = useNavigate();
  const filtered = useMemo(() => personas.filter((p) => p.region === region), [region]);
  function start() { if (!selected) return; setCompanions((v) => [...v, selected]); setSelected(null); }

  if (companions.length) return <section className="tab-page">
    <div className="page-title row-title"><div><span>{t("CUỘC TRÒ CHUYỆN", "CONVERSATIONS")}</span><h1>{t("Bạn gái AI", "AI girlfriend")}</h1></div><Button size="icon" variant="gradient" onClick={() => setCompanions([])} aria-label={t("Thêm nhân vật", "Add a character")}><Plus /></Button></div>
    <div className="chat-list">{companions.map((p) => <button type="button" key={p.id} onClick={() => navigate({ to: "/app/chat/$companionId", params: { companionId: p.id } })}><div className="avatar-orbit small"><span>{p.name[0]}</span></div><div><strong>{p.name}</strong><p>Chào bạn, hôm nay thế nào rồi?</p></div><time>21:08</time></button>)}</div>
  </section>;

  return <section className="tab-page">
    <div className="page-title"><span>{t("TRÒ CHUYỆN TỰ NHIÊN", "NATURAL CONVERSATION")}</span><h1>{t("Chọn người bạn trò chuyện", "Choose who you chat with")}</h1><p>{t("Cứ là chính mình. Đây là không gian để bạn trò chuyện và luyện tập.", "Just be yourself. This is a space to chat and practise.")}</p></div>
    <div className="persona-carousel">{filtered.map((p) => <PersonaCard key={p.id} persona={p} selected={selected?.id === p.id} onSelect={() => setSelected(p)} />)}</div>
    {selected && <div className="confirm-sheet fade-up">
      <div className="sheet-handle" />
      <div className="flex items-center gap-3"><div className="avatar-orbit small"><span>{selected.name[0]}</span></div><div><h2>{selected.name}, {selected.age}</h2><p>{selected.job} · {selected.city}</p></div></div>
      <label>{t("Tính cách", "Personality")}</label>
      <div className="flex flex-wrap gap-2">{["Dịu dàng", "Tinh nghịch", "Chín chắn"].map((x) => <button type="button" key={x} className={personality === x ? "chip chip-active" : "chip"} onClick={() => setPersonality(x)}>{x}</button>)}</div>
      <label>{t("Chế độ", "Mode")}</label>
      <div className="segmented"><button type="button" className={mode === "Trò chuyện" ? "active" : ""} onClick={() => setMode("Trò chuyện")}>{t("Trò chuyện", "Chat")}</button><button type="button" className={mode !== "Trò chuyện" ? "active" : ""} onClick={() => setMode("Luyện tập tán tỉnh")}>{t("Luyện tập tán tỉnh", "Flirting practice")}</button></div>
      <Button variant="gradient" size="lg" onClick={start}>{t("Bắt đầu nhắn tin", "Start chatting")}</Button>
    </div>}
  </section>;
}
