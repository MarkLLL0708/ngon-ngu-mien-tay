import { useEffect, useRef, useState } from "react";
import { Plus, Sparkles, Trash2, Upload } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { IMAGE_TYPES, MAX_IMAGE_BYTES, uploadPersonaMedia, useMediaUrl } from "@/lib/tangpt-personas";
import { suggestMomentCaption } from "@/lib/moments.functions";

type Source = "persona" | "shared";
type PoolImage = { id: string; image_url: string; caption_hint: string; source: Source };
type MomentRow = { id: string; caption: string; image_source: Source; image_id: string; posted_at: string; published: boolean };

function Thumb({ path }: { path: string }) {
  const url = useMediaUrl(path);
  return url ? <img src={url} alt="" /> : <div />;
}

export function PersonaMomentsEditor({ personaId }: { personaId: string }) {
  const suggest = useServerFn(suggestMomentCaption);
  const [rows, setRows] = useState<MomentRow[]>([]);
  const [pool, setPool] = useState<PoolImage[]>([]);
  const [form, setForm] = useState<{ id?: string; caption: string; pick?: PoolImage | undefined } | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState<{ id: string; action: "delete" | "toggle" } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const [m, p, s] = await Promise.all([
      supabase.from("persona_moments").select("id, caption, image_source, image_id, posted_at, published").eq("persona_id", personaId).order("posted_at", { ascending: false }),
      supabase.from("persona_image_moments").select("id, image_url, caption_hint").eq("persona_id", personaId).order("created_at", { ascending: false }),
      supabase.from("shared_image_moments").select("id, image_url, caption_hint").eq("active", true).order("created_at", { ascending: false }),
    ]);
    setRows((m.data ?? []) as MomentRow[]);
    setPool([
      ...(p.data ?? []).map((r) => ({ ...r, source: "persona" as const })),
      ...(s.data ?? []).map((r) => ({ ...r, source: "shared" as const })),
    ]);
  }
  useEffect(() => { void load(); }, [personaId]);

  const pathOf = (row: MomentRow) => pool.find((p) => p.id === row.image_id)?.image_url ?? "";

  async function uploadNew(file?: File) {
    if (!file) return;
    setError("");
    if (!IMAGE_TYPES.includes(file.type)) { setError("Chỉ nhận ảnh JPG, PNG hoặc WebP."); return; }
    if (file.size > MAX_IMAGE_BYTES) { setError("Ảnh tối đa 8MB."); return; }
    setBusy("upload");
    try {
      const path = await uploadPersonaMedia(personaId, file);
      const { data } = await supabase.from("persona_image_moments")
        .insert({ persona_id: personaId, category: "moments", image_url: path, caption_hint: "" })
        .select("id, image_url, caption_hint").single();
      if (data) {
        const img: PoolImage = { ...data, source: "persona" };
        setPool((cur) => [img, ...cur]);
        setForm((f) => (f ? { ...f, pick: img } : f));
      }
    } catch { setError("Tải ảnh lên thất bại, thử lại nhé."); }
    setBusy("");
    if (fileRef.current) fileRef.current.value = "";
  }

  async function draftCaption() {
    if (!form) return;
    setBusy("suggest"); setError("");
    try {
      const { caption } = await suggest({ data: { persona_id: personaId, hint: form.pick?.caption_hint ?? "" } });
      setForm((f) => (f ? { ...f, caption } : f));
    } catch (e) {
      setError(String(e).includes("no_credits") ? "Hết AI credits, viết caption tay nhé." : "Chưa gợi ý được, thử lại nhé.");
    }
    setBusy("");
  }

  async function saveForm() {
    if (!form?.pick) { setError("Chọn một ảnh trước."); return; }
    setBusy("save");
    const payload = { caption: form.caption.trim(), image_source: form.pick.source, image_id: form.pick.id };
    const { error: err } = form.id
      ? await supabase.from("persona_moments").update(payload).eq("id", form.id)
      : await supabase.from("persona_moments").insert({ ...payload, persona_id: personaId });
    setBusy("");
    if (err) { setError("Lưu thất bại."); return; }
    setForm(null);
    await load();
  }

  async function runConfirm() {
    if (!confirm) return;
    const row = rows.find((r) => r.id === confirm.id);
    if (confirm.action === "delete") await supabase.from("persona_moments").delete().eq("id", confirm.id);
    else if (row) await supabase.from("persona_moments").update({ published: !row.published }).eq("id", confirm.id);
    setConfirm(null);
    await load();
  }

  return <div className="admin-field">
    <p className="text-sm text-muted-foreground">Bài đăng khoảnh khắc hiện trong Nhật ký của mọi người đang trò chuyện với nhân vật này.</p>
    {!form && <Button variant="gradient" onClick={() => { setError(""); setForm({ caption: "" }); }}><Plus /> Đăng khoảnh khắc mới</Button>}

    {form && <div className="filter-block">
      <strong>{form.id ? "Sửa khoảnh khắc" : "Khoảnh khắc mới"}</strong>
      <label className="text-sm">Chọn ảnh (kho riêng + kho chung)</label>
      <div className="moment-pick">
        {pool.map((img) => <button type="button" key={`${img.source}-${img.id}`} aria-pressed={form.pick?.id === img.id}
          title={img.source === "shared" ? "Kho chung" : "Kho riêng"} onClick={() => setForm({ ...form, pick: img })}>
          <Thumb path={img.image_url} />
        </button>)}
      </div>
      <input ref={fileRef} type="file" hidden accept={IMAGE_TYPES.join(",")} onChange={(e) => void uploadNew(e.target.files?.[0])} />
      <Button variant="outline" disabled={busy === "upload"} onClick={() => fileRef.current?.click()}>
        <Upload /> {busy === "upload" ? "Đang tải…" : "Tải ảnh mới lên"}
      </Button>
      <label htmlFor="moment-caption-text" className="text-sm">Caption</label>
      <Textarea id="moment-caption-text" rows={2} value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} placeholder="cà phê sáng nay nhẹ nhàng ghê ☕" />
      <Button variant="outline" disabled={busy === "suggest"} onClick={() => void draftCaption()}>
        <Sparkles /> {busy === "suggest" ? "Đang viết…" : "Gợi ý caption bằng giọng của cô ấy"}
      </Button>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => setForm(null)}>Hủy</Button>
        <Button variant="gradient" disabled={busy === "save"} onClick={() => void saveForm()}>{form.id ? "Lưu" : "Đăng"}</Button>
      </div>
    </div>}
    {error && <p className="text-sm text-destructive">{error}</p>}

    <div className="moment-grid">
      {rows.map((row) => <div key={row.id} className="moment-card">
        <div className="moment-thumb" style={{ overflow: "hidden" }}><Thumb path={pathOf(row)} /></div>
        <div className="min-w-0">
          <strong>{row.caption || "—"}</strong>
          <small>{new Date(row.posted_at).toLocaleString("vi-VN")} · {row.published ? "Đang hiện" : "Đang ẩn"}</small>
          {confirm?.id === row.id && <div className="flex flex-wrap gap-2 mt-2">
            <span className="text-sm">{confirm.action === "delete" ? "Xóa vĩnh viễn?" : row.published ? "Ẩn bài này?" : "Hiện bài này?"}</span>
            <Button size="sm" variant="outline" onClick={() => setConfirm(null)}>Hủy</Button>
            <Button size="sm" variant={confirm.action === "delete" ? "destructive" : "gradient"} onClick={() => void runConfirm()}>Xác nhận</Button>
          </div>}
        </div>
        <div className="flex items-center gap-1">
          <Switch checked={row.published} onCheckedChange={() => setConfirm({ id: row.id, action: "toggle" })} aria-label="Hiện/ẩn" />
          <Button variant="ghost" size="sm" onClick={() => setForm({ id: row.id, caption: row.caption, pick: pool.find((p) => p.id === row.image_id) })}>Sửa</Button>
          <Button variant="ghost" size="icon" aria-label="Xóa" onClick={() => setConfirm({ id: row.id, action: "delete" })}><Trash2 /></Button>
        </div>
      </div>)}
      {rows.length === 0 && <p className="text-sm text-muted-foreground">Chưa có khoảnh khắc nào.</p>}
    </div>
  </div>;
}
