import { useEffect, useState } from "react";
import { Check, Pin, PinOff, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "./Language";
import { supabase } from "@/integrations/supabase/client";
import { personaPronoun } from "@/lib/tangpt-companions";
import { toast } from "sonner";

type Memory = { id: string; fact: string; category: string; pinned: boolean };

const CATEGORIES: { key: string; vi: string; en: string }[] = [
  { key: "basic", vi: "Cơ bản", en: "Basics" },
  { key: "work", vi: "Công việc", en: "Work" },
  { key: "interests", vi: "Sở thích", en: "Interests" },
  { key: "plans", vi: "Kế hoạch", en: "Plans" },
  { key: "people", vi: "Người thân và bạn bè", en: "People" },
  { key: "preferences", vi: "Sở thích ăn uống", en: "Food preferences" },
  { key: "events", vi: "Sự kiện", en: "Events" },
];

export function MemorySheet({ companionId, personaGender, onClose, onWiped }: {
  companionId: string; personaGender: string; onClose: () => void; onWiped: () => void;
}) {
  const { t, lang } = useLang();
  const [items, setItems] = useState<Memory[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [newFact, setNewFact] = useState("");
  const [confirm, setConfirm] = useState<"memories" | "messages" | null>(null);

  useEffect(() => {
    let active = true;
    supabase.from("companion_memories").select("id, fact, category, pinned").eq("companion_id", companionId)
      .order("pinned", { ascending: false }).order("created_at", { ascending: false })
      .then(({ data }) => { if (active) setItems((data ?? []) as Memory[]); });
    return () => { active = false; };
  }, [companionId]);

  async function saveEdit(id: string) {
    const fact = draft.trim();
    if (!fact) return;
    setItems((list) => list.map((item) => (item.id === id ? { ...item, fact } : item)));
    setEditing(null);
    await supabase.from("companion_memories").update({ fact, updated_at: new Date().toISOString() }).eq("id", id);
  }

  async function togglePin(item: Memory) {
    setItems((list) => list.map((x) => (x.id === item.id ? { ...x, pinned: !x.pinned } : x)));
    await supabase.from("companion_memories").update({ pinned: !item.pinned }).eq("id", item.id);
  }

  async function remove(id: string) {
    setItems((list) => list.filter((x) => x.id !== id));
    await supabase.from("companion_memories").delete().eq("id", id);
  }

  async function add() {
    const fact = newFact.trim();
    if (!fact) return;
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) return;
    const { data } = await supabase.from("companion_memories")
      .insert({ companion_id: companionId, user_id: userId, fact, category: "basic", pinned: true })
      .select("id, fact, category, pinned").single();
    if (data) setItems((list) => [data as Memory, ...list]);
    setNewFact("");
    toast.success(t("Đã lưu", "Saved"));
  }

  async function wipeMemories() {
    await supabase.from("companion_memories").delete().eq("companion_id", companionId);
    await supabase.from("companions").update({ memory_summary: "" }).eq("id", companionId);
    setItems([]);
    setConfirm(null);
    toast.success(t("Đã xóa toàn bộ ký ức", "All memories deleted"));
  }

  async function wipeMessages() {
    await supabase.from("companion_messages").delete().eq("companion_id", companionId);
    await supabase.from("companions").update({ last_message_preview: "", last_message_at: null }).eq("id", companionId);
    setConfirm(null);
    onWiped();
    toast.success(t("Đã xóa lịch sử trò chuyện", "Chat history deleted"));
  }

  const vi = lang === "vi";
  const who = personaPronoun(personaGender, vi);
  return <div className="memory-sheet fade-up">
    <header>
      <h2>{vi ? `${who} nhớ gì về bạn` : "What they remember about you"}</h2>
      <Button variant="ghost" size="icon" aria-label={t("Đóng", "Close")} onClick={onClose}><X /></Button>
    </header>
    <div className="memory-body">
      <p className="memory-note">{t(
        "Chỉ lưu những điều bạn tự nói. Không lưu thông tin sức khỏe, tài chính hay giấy tờ cá nhân.",
        "Only things you tell them are saved. Health, finances and ID details are never saved.")}</p>

      <div className="memory-add">
        <input value={newFact} onChange={(e) => setNewFact(e.target.value)}
          placeholder={vi ? `Thêm điều ${who.toLowerCase()} nên nhớ` : "Add something they should remember"} />
        <Button variant="gradient" size="icon" aria-label={t("Thêm", "Add")} onClick={() => void add()}><Plus /></Button>
      </div>

      {items.length === 0 && <p className="chat-hint">{t("Chưa có ký ức nào.", "No memories yet.")}</p>}

      {CATEGORIES.map((cat) => {
        const group = items.filter((item) => item.category === cat.key);
        if (group.length === 0) return null;
        return <section key={cat.key} className="memory-group">
          <h3>{vi ? cat.vi : cat.en}</h3>
          {group.map((item) => <div key={item.id} className="memory-row">
            {editing === item.id
              ? <>
                  <input value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus />
                  <button type="button" aria-label={t("Lưu", "Save")} onClick={() => void saveEdit(item.id)}><Check /></button>
                </>
              : <>
                  <p onClick={() => { setEditing(item.id); setDraft(item.fact); }}>{item.fact}</p>
                  <button type="button" aria-label={item.pinned ? t("Bỏ ghim", "Unpin") : t("Ghim", "Pin")}
                    className={item.pinned ? "pinned" : ""} onClick={() => void togglePin(item)}>
                    {item.pinned ? <Pin /> : <PinOff />}
                  </button>
                </>}
            <button type="button" aria-label={t("Xóa", "Delete")} onClick={() => void remove(item.id)}><Trash2 /></button>
          </div>)}
        </section>;
      })}

      <div className="memory-danger">
        <Button variant="outline" onClick={() => setConfirm("memories")}>{t("Xóa toàn bộ ký ức", "Delete all memories")}</Button>
        <Button variant="outline" onClick={() => setConfirm("messages")}>{t("Xóa lịch sử trò chuyện", "Delete chat history")}</Button>
      </div>

      {confirm && <div className="memory-confirm">
        <p>{confirm === "memories"
          ? t("Xóa toàn bộ ký ức? Không thể hoàn tác.", "Delete all memories? This cannot be undone.")
          : t("Xóa toàn bộ lịch sử trò chuyện? Không thể hoàn tác.", "Delete the whole chat history? This cannot be undone.")}</p>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => setConfirm(null)}>{t("Hủy", "Cancel")}</Button>
          <Button variant="gradient" onClick={() => void (confirm === "memories" ? wipeMemories() : wipeMessages())}>{t("Xóa", "Delete")}</Button>
        </div>
      </div>}
    </div>
  </div>;
}
