import { useEffect, useRef, useState } from "react";
import { Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { deletePersonaMedia, IMAGE_TYPES, MAX_IMAGE_BYTES, uploadPersonaMedia, useMediaUrl } from "@/lib/tangpt-personas";

type Moment = { id: string; category: string; image_url: string; caption_hint: string; times_shown: number };

function MomentThumb({ path }: { path: string }) {
  const url = useMediaUrl(path);
  return url ? <img src={url} alt="" className="moment-thumb" /> : <div className="moment-thumb" />;
}

export function ImageMomentsEditor({ personaId }: { personaId: string }) {
  const [rows, setRows] = useState<Moment[]>([]);
  const [category, setCategory] = useState("");
  const [caption, setCaption] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const { data } = await supabase
      .from("persona_image_moments")
      .select("id, category, image_url, caption_hint, times_shown")
      .eq("persona_id", personaId)
      .order("created_at", { ascending: false });
    setRows((data ?? []) as Moment[]);
  }

  useEffect(() => { void load(); }, [personaId]);

  async function addMoment(file: File | undefined) {
    if (!file) return;
    setError("");
    if (!IMAGE_TYPES.includes(file.type)) { setError("Chỉ nhận ảnh JPG, PNG hoặc WebP."); return; }
    if (file.size > MAX_IMAGE_BYTES) { setError("Ảnh tối đa 8MB."); return; }
    if (!category.trim()) { setError("Nhập nhóm ảnh trước (ví dụ: cà phê, đi chơi, ở nhà)."); return; }
    setProgress(0);
    try {
      const path = await uploadPersonaMedia(personaId, file, setProgress);
      await supabase.from("persona_image_moments").insert({
        persona_id: personaId, category: category.trim().toLowerCase(), image_url: path, caption_hint: caption.trim(),
      });
      setCaption("");
      await load();
    } catch { setError("Tải ảnh lên thất bại, thử lại nhé."); }
    setProgress(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function removeMoment(row: Moment) {
    await deletePersonaMedia(row.image_url);
    await supabase.from("persona_image_moments").delete().eq("id", row.id);
    await load();
  }

  return <div className="admin-field">
    <p className="text-sm text-muted-foreground">
      Ảnh khoảnh khắc là ảnh nhân vật có thể chủ động gửi khi hợp mạch chuyện. Mỗi ảnh cần một nhóm (category).
    </p>
    <div className="admin-field">
      <label htmlFor="moment-category">Nhóm ảnh</label>
      <Input id="moment-category" value={category} onChange={(event) => setCategory(event.target.value)} placeholder="cà phê" />
    </div>
    <div className="admin-field">
      <label htmlFor="moment-caption">Gợi ý chú thích (không bắt buộc)</label>
      <Input id="moment-caption" value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="quán quen gần nhà" />
    </div>
    <input ref={fileRef} type="file" accept={IMAGE_TYPES.join(",")} hidden onChange={(event) => void addMoment(event.target.files?.[0])} />
    <Button variant="outline" disabled={progress !== null} onClick={() => fileRef.current?.click()}>
      <Upload /> {progress === null ? "Thêm ảnh khoảnh khắc" : `Đang tải ${progress}%`}
    </Button>
    {error && <p className="text-sm text-destructive">{error}</p>}
    <div className="moment-grid">
      {rows.map((row) => <div key={row.id} className="moment-card">
        <MomentThumb path={row.image_url} />
        <div className="min-w-0">
          <strong>{row.category}</strong>
          <small>{row.caption_hint || "—"} · đã gửi {row.times_shown} lần</small>
        </div>
        <Button variant="ghost" size="icon" aria-label="Xóa ảnh" onClick={() => void removeMoment(row)}><Trash2 /></Button>
      </div>)}
      {rows.length === 0 && <p className="text-sm text-muted-foreground">Chưa có ảnh khoảnh khắc nào.</p>}
    </div>
  </div>;
}
