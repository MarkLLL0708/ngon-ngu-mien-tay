import { useEffect, useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "./Language";
import { supabase } from "@/integrations/supabase/client";

type Item = { id: string; input: string; createdAt: string; first: string };

export function HistoryTab() {
  const { t } = useLang();
  const [items, setItems] = useState<Item[]>([]);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.from("reply_generations").select("id, input_text, created_at, result").order("created_at", { ascending: false }).limit(30);
      if (!active) return;
      if (data && data.length > 0) {
        setItems(data.map((row) => {
          const result = row.result as { options?: { text?: string }[] } | null;
          return { id: row.id, input: row.input_text, createdAt: row.created_at, first: result?.options?.[0]?.text ?? "" };
        }));
        return;
      }
      const local = JSON.parse(window.localStorage.getItem("tangpt-history") || "[]") as { id: string; input: string; createdAt: string; options: { text: string }[] }[];
      setItems(local.map((row) => ({ id: row.id, input: row.input, createdAt: row.createdAt, first: row.options[0]?.text ?? "" })));
    })();
    return () => { active = false; };
  }, []);

  async function copy(item: Item) {
    await navigator.clipboard.writeText(item.first);
    setCopied(item.id); window.setTimeout(() => setCopied(""), 2000);
  }

  return <section className="tab-page">
    <div className="page-title"><span>{t("LƯU LẠI", "SAVED")}</span><h1>{t("Lịch sử gợi ý", "Suggestion history")}</h1></div>
    {items.length === 0 && <p className="empty-note">{t("Chưa có gợi ý nào. Qua tab Gợi ý thử liền nha.", "Nothing yet. Head to the suggestions tab to try it.")}</p>}
    <div className="history-list">{items.map((item) => <article key={item.id}>
      <header><time>{new Date(item.createdAt).toLocaleString("vi-VN")}</time></header>
      <p className="history-input">{item.input}</p>
      <p>{item.first}</p>
      <Button variant="ghost" size="sm" onClick={() => copy(item)}>{copied === item.id ? <><Check />{t("Đã chép", "Copied")}</> : <><Copy />{t("Sao chép", "Copy")}</>}</Button>
    </article>)}</div>
  </section>;
}
