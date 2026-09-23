import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { deletePersonaMedia, IMAGE_TYPES, MAX_IMAGE_BYTES, uploadPersonaMedia, useMediaUrl } from "@/lib/tangpt-personas";

const SHARED_CATEGORIES = ["food", "coffee", "street", "sunset", "desk", "weather", "view", "pet_generic"];
const RECENT_WINDOW = 20;
const LOW_STOCK = 5;

type SharedRow = { id: string; category: string; image_url: string; caption_hint: string; active: boolean };
type Stock = { label: string; fresh: number; total: number };

function Thumb({ path }: { path: string }) {
  const url = useMediaUrl(path);
  return url ? <img src={url} alt="" className="moment-thumb" /> : <div className="moment-thumb" />;
}

/** Ảnh "đã dùng gần đây" = nằm trong 20 lần gửi gần nhất của bất kỳ cuộc trò chuyện nào. */
async function recentlyShownIds(): Promise<Set<string>> {
  const { data } = await supabase
    .from("companion_image_history")
    .select("companion_id, image_id, shown_at")
    .order("shown_at", { ascending: false })
    .limit(1000);
  const perCompanion = new Map<string, number>();
  const shown = new Set<string>();
  for (const row of (data ?? []) as { companion_id: string | null; image_id: string | null }[]) {
    const key = row.companion_id ?? "none";
    const count = perCompanion.get(key) ?? 0;
    if (count >= RECENT_WINDOW) continue;
    perCompanion.set(key, count + 1);
    if (row.image_id) shown.add(row.image_id);
  }
  return shown;
}

export function ImagePoolPanel() {
  const [rows, setRows] = useState<SharedRow[]>([]);
  const [sharedStock, setSharedStock] = useState<Stock[]>([]);
  const [personaStock, setPersonaStock] = useState<Stock[]>([]);
  const [category, setCategory] = useState(SHARED_CATEGORIES[0]!);
  const [caption, setCaption] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const [{ data: shared }, { data: personaRows }, { data: personas }, shownIds] = await Promise.all([
      supabase.from("shared_image_moments").select("id, category, image_url, caption_hint, active").order("created_at", { ascending: false }),
      supabase.from("persona_image_moments").select("id, persona_id, category"),
      supabase.from("personas").select("id, name"),
      recentlyShownIds(),
    ]);
    const sharedList = (shared ?? []) as SharedRow[];
    setRows(sharedList);

    setSharedStock(SHARED_CATEGORIES.map((key) => {
      const pool = sharedList.filter((row) => row.category === key && row.active);
      return { label: key, total: pool.length, fresh: pool.filter((row) => !shownIds.has(row.id)).length };
    }));

    const names = new Map((personas ?? []).map((row) => [(row as { id: string }).id, (row as { name: string }).name]));
    const byPersona = new Map<string, { id: string }[]>();
    for (const row of (personaRows ?? []) as { id: string; persona_id: string | null }[]) {
      if (!row.persona_id) continue;
      byPersona.set(row.persona_id, [...(byPersona.get(row.persona_id) ?? []), { id: row.id }]);
    }
    setPersonaStock(Array.from(names.entries()).map(([id, name]) => {
      const pool = byPersona.get(id) ?? [];
      return { label: name, total: pool.length, fresh: pool.filter((item) => !shownIds.has(item.id)).length };
    }));
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function addShared(file: File | undefined) {
    if (!file) return;
    setError("");
    if (!IMAGE_TYPES.includes(file.type)) { setError("Chỉ nhận ảnh JPG, PNG hoặc WebP."); return; }
    if (file.size > MAX_IMAGE_BYTES) { setError("Ảnh tối đa 8MB."); return; }
    setProgress(0);
    try {
      const path = await uploadPersonaMedia("shared", file, setProgress);
      await supabase.from("shared_image_moments").insert({ category, image_url: path, caption_hint: caption.trim() });
      setCaption("");
      await load();
    } catch { setError("Tải ảnh lên thất bại, thử lại nhé."); }
    setProgress(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function removeShared(row: SharedRow) {
    await deletePersonaMedia(row.image_url);
    await supabase.from("shared_image_moments").delete().eq("id", row.id);
    await load();
  }

  const lowShared = sharedStock.filter((item) => item.fresh < LOW_STOCK);
  const lowPersona = personaStock.filter((item) => item.fresh < LOW_STOCK);

  return <div className="filter-block">
    <div className="admin-section-head"><strong>Kho ảnh khoảnh khắc</strong></div>
    <p className="text-sm text-muted-foreground">
      Kho chung là ảnh không có mặt nhân vật (đồ ăn, cà phê, đường phố…) dùng được cho mọi nhân vật.
      Kho riêng của từng nhân vật nằm trong trang sửa nhân vật.
    </p>

    <div className="stock-grid">
      {sharedStock.map((item) => <div key={item.label} className={item.fresh < LOW_STOCK ? "stock-cell stock-low" : "stock-cell"}>
        <strong>{item.label}</strong><small>{item.fresh} ảnh còn mới / {item.total}</small>
      </div>)}
    </div>
    <div className="stock-grid">
      {personaStock.map((item) => <div key={item.label} className={item.fresh < LOW_STOCK ? "stock-cell stock-low" : "stock-cell"}>
        <strong>{item.label}</strong><small>{item.fresh} ảnh còn mới / {item.total}</small>
      </div>)}
    </div>

    {[...lowShared, ...lowPersona].map((item) => <div key={`low-${item.label}`} className="stock-banner">
      <AlertTriangle size={16} /> Sắp hết ảnh cho {item.label} — nên tạo thêm.
    </div>)}

    <div className="admin-field">
      <label htmlFor="shared-category">Nhóm ảnh (kho chung)</label>
      <div className="flex flex-wrap gap-2">{SHARED_CATEGORIES.map((key) =>
        <button type="button" key={key} className={category === key ? "chip chip-active" : "chip"} onClick={() => setCategory(key)}>{key}</button>)}</div>
      <label htmlFor="shared-caption">Gợi ý chú thích (không bắt buộc)</label>
      <Input id="shared-caption" value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="ly cà phê chiều nay" />
      <input ref={fileRef} type="file" accept={IMAGE_TYPES.join(",")} hidden onChange={(event) => void addShared(event.target.files?.[0])} />
      <Button variant="outline" disabled={progress !== null} onClick={() => fileRef.current?.click()}>
        <Upload /> {progress === null ? "Thêm ảnh vào kho chung" : `Đang tải ${progress}%`}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>

    <div className="moment-grid">
      {rows.map((row) => <div key={row.id} className="moment-card">
        <Thumb path={row.image_url} />
        <div className="min-w-0"><strong>{row.category}</strong><small>{row.caption_hint || "—"}</small></div>
        <Button variant="ghost" size="icon" aria-label="Xóa ảnh" onClick={() => void removeShared(row)}><Trash2 /></Button>
      </div>)}
      {rows.length === 0 && <p className="text-sm text-muted-foreground">Kho chung chưa có ảnh nào.</p>}
    </div>
  </div>;
}
