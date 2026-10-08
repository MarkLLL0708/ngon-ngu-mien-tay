import { useEffect, useState } from "react";
import { BookHeart, LoaderCircle, X } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { listJournal, type JournalEntry } from "@/lib/journal.functions";
import { useLang } from "./Language";

const MOOD_EN: Record<string, string> = {
  "ấm áp": "warm", vui: "happy", "tò mò": "curious", "hơi lo": "a bit worried",
  "bình yên": "peaceful", "phấn khích": "excited", "suy tư": "thoughtful",
};

export function JournalSheet({ companionId, name, onClose }: { companionId: string; name: string; onClose: () => void }) {
  const { t, lang } = useLang();
  const vi = lang === "vi";
  const fetchJournal = useServerFn(listJournal);
  const [entries, setEntries] = useState<JournalEntry[] | null>(null);

  useEffect(() => {
    let active = true;
    fetchJournal({ data: { companion_id: companionId } })
      .then((rows) => { if (active) setEntries(rows); })
      .catch(() => { if (active) setEntries([]); });
    return () => { active = false; };
  }, [companionId, fetchJournal]);

  return <div className="memory-sheet fade-up" role="dialog" aria-modal="true">
    <header>
      <h2 className="flex items-center gap-2"><BookHeart size={18} />{vi ? `Nhật ký của ${name}` : `${name}'s journal`}</h2>
      <button type="button" className="chip" aria-label={t("Đóng", "Close")} onClick={onClose}><X size={14} /></button>
    </header>
    <div style={{ overflowY: "auto", padding: "16px", maxWidth: 680, width: "100%", margin: "0 auto" }}>
      {entries === null && <div className="thread-loader"><LoaderCircle className="animate-spin" /></div>}
      {entries?.length === 0 && <p className="chat-hint">{vi
        ? `Nhật ký của ${name} sẽ xuất hiện sau tuần đầu trò chuyện.`
        : `${name}'s journal will appear after your first week chatting.`}</p>}
      <div className="flex flex-col gap-3">
        {entries?.map((entry) => <article key={entry.id} className="journal-card">
          <div className="flex items-center justify-between gap-2">
            <small>{new Date(entry.entry_date).toLocaleDateString(vi ? "vi-VN" : "en-GB")}</small>
            <span className="chip chip-active">{vi ? entry.mood_tag : (MOOD_EN[entry.mood_tag] ?? entry.mood_tag)}</span>
          </div>
          <p style={{ whiteSpace: "pre-wrap" }}>{entry.content}</p>
          {entry.image_url && <img className="msg-image" src={entry.image_url} alt={t("Ảnh trong nhật ký", "Journal photo")} />}
        </article>)}
      </div>
    </div>
  </div>;
}
