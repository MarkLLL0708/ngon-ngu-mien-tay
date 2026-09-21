import { useEffect, useState } from "react";
import { Clock3, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang } from "./Language";
import type { Generation } from "./SuggestTab";

export function HistoryTab() {
  const [items, setItems] = useState<Generation[]>([]);
  const { t } = useLang();
  useEffect(() => setItems(JSON.parse(window.localStorage.getItem("tangpt-history") || "[]") as Generation[]), []);
  return <section className="tab-page">
    <div className="page-title"><span>{t("XEM LẠI KHI CẦN", "REVISIT ANYTIME")}</span><h1>{t("Lịch sử gợi ý", "Suggestion history")}</h1></div>
    {items.length === 0
      ? <div className="empty-state"><Clock3 /><h2>{t("Chưa có gì ở đây", "Nothing here yet")}</h2><p>{t("Tạo gợi ý đầu tiên, mình sẽ giữ lại giúp bạn.", "Create your first suggestion and we'll keep it for you.")}</p></div>
      : <div className="history-list">{items.map((item) => <article key={item.id}><small>{t("Vừa xong", "Just now")} · {item.input}</small><p>{item.options[0]?.text}</p><Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(item.options[0]?.text ?? "")}><Copy />{t("Sao chép", "Copy")}</Button></article>)}</div>}
  </section>;
}
