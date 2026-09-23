import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Check, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { GalleryEditor } from "./GalleryEditor";
import { VideoEditor } from "./VideoEditor";
import { ImageMomentsEditor } from "./ImageMomentsEditor";

import { PersonaIntro } from "../PersonaIntro";
import { supabase } from "@/integrations/supabase/client";
import { deletePersonaMedia, PERSONA_SELECT, type PersonaRow } from "@/lib/tangpt-personas";
import { regions, type RegionKey } from "@/lib/tangpt-data";

const regionKeys: RegionKey[] = ["bac", "nam", "trung", "tay"];
const basicFields = [
  ["name", "Tên"], ["age_vibe", "Tuổi"], ["city", "Thành phố"], ["job", "Nghề nghiệp"], ["personality", "Tính cách"],
] as const;
const bioFields = [
  ["backstory", "Tiểu sử"], ["family", "Gia đình"], ["daily_life", "Cuộc sống hằng ngày"], ["quirks", "Nét riêng"],
  ["favorite_things", "Sở thích"], ["opinions", "Quan điểm"], ["catchphrase", "Câu cửa miệng"],
] as const;

export function PersonaEditor({ personaId }: { personaId: string }) {
  const navigate = useNavigate();
  const [row, setRow] = useState<PersonaRow | null | undefined>(undefined);
  const [saved, setSaved] = useState("");
  const [preview, setPreview] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmName, setConfirmName] = useState("");

  useEffect(() => {
    supabase.from("personas").select(PERSONA_SELECT).eq("id", personaId).maybeSingle()
      .then(({ data }) => setRow((data as PersonaRow) ?? null));
  }, [personaId]);

  function patch(next: Partial<PersonaRow>) { setRow((current) => (current ? { ...current, ...next } : current)); }

  async function save(section: string, fields: Partial<PersonaRow>) {
    await supabase.from("personas").update({ ...fields, updated_at: new Date().toISOString() }).eq("id", personaId);
    setSaved(section);
    setTimeout(() => setSaved((current) => (current === section ? "" : current)), 2500);
  }

  async function removePersona() {
    if (!row) return;
    for (const path of row.gallery_urls) await deletePersonaMedia(path);
    if (row.intro_video_url) await deletePersonaMedia(row.intro_video_url);
    await supabase.from("personas").delete().eq("id", personaId);
    navigate({ to: "/app/admin/personas" });
  }

  if (row === undefined) return <p className="text-sm text-muted-foreground">Đang tải…</p>;
  if (!row) return <p className="text-sm text-muted-foreground">Không tìm thấy nhân vật.</p>;

  const savedChip = (section: string) => saved === section
    ? <span className="saved-chip"><Check /> Đã lưu</span>
    : null;

  return <section className="tab-page admin-editor">
    <div className="row-title">
      <div className="page-title"><span>QUẢN TRỊ</span><h1>{row.name}</h1></div>
      <Button variant="outline" size="sm" onClick={() => setPreview(true)}><Eye /> Xem trước</Button>
    </div>

    <div className="filter-block">
      <div className="admin-section-head"><strong>Hiển thị</strong>{savedChip("published")}</div>
      <div className="admin-row-actions">
        <Switch checked={row.published} onCheckedChange={(value) => { patch({ published: value }); save("published", { published: value }); }} />
        <span className="text-sm text-muted-foreground">{row.published ? "Đang hiển thị với người dùng" : "Đang ẩn khỏi ứng dụng"}</span>
      </div>
    </div>

    <div className="filter-block">
      <div className="admin-section-head"><strong>Thông tin cơ bản</strong>{savedChip("basic")}</div>
      {basicFields.map(([key, label]) => <div key={key} className="admin-field">
        <label htmlFor={key}>{label}</label>
        <Input id={key} value={row[key]} onChange={(event) => patch({ [key]: event.target.value } as Partial<PersonaRow>)} />
      </div>)}
      <div className="admin-field">
        <label>Vùng miền</label>
        <div className="flex flex-wrap gap-2">{regionKeys.map((key) =>
          <button type="button" key={key} className={row.region === key ? "chip chip-active" : "chip"} onClick={() => patch({ region: key })}>{regions[key].name}</button>)}</div>
      </div>
      <div className="admin-field">
        <label>Giới tính nhân vật</label>
        <div className="flex flex-wrap gap-2">{([["female", "Nữ"], ["male", "Nam"]] as [string, string][]).map(([value, label]) =>
          <button type="button" key={value} className={row.persona_gender === value ? "chip chip-active" : "chip"} onClick={() => patch({ persona_gender: value })}>{label}</button>)}</div>
      </div>
      <div className="admin-field">
        <label htmlFor="tags">Thẻ (cách nhau bằng dấu phẩy)</label>
        <Input id="tags" value={row.tags.join(", ")} onChange={(event) => patch({ tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean) })} />
      </div>
      <Button variant="gradient" onClick={() => save("basic", {
        name: row.name, age_vibe: row.age_vibe, region: row.region, city: row.city, job: row.job,
        persona_gender: row.persona_gender, personality: row.personality, tags: row.tags,
      })}>Lưu thông tin cơ bản</Button>
    </div>

    <div className="filter-block">
      <div className="admin-section-head"><strong>Hồ sơ nhân vật</strong>{savedChip("bio")}</div>
      {bioFields.map(([key, label]) => <div key={key} className="admin-field">
        <label htmlFor={key}>{label}</label>
        <Textarea id={key} rows={3} value={row[key]} onChange={(event) => patch({ [key]: event.target.value } as Partial<PersonaRow>)} />
      </div>)}
      <Button variant="gradient" onClick={() => save("bio", {
        backstory: row.backstory, family: row.family, daily_life: row.daily_life, quirks: row.quirks,
        favorite_things: row.favorite_things, opinions: row.opinions, catchphrase: row.catchphrase,
      })}>Lưu hồ sơ</Button>
    </div>

    <div className="filter-block">
      <div className="admin-section-head"><strong>Thư viện ảnh</strong>{savedChip("gallery")}</div>
      <GalleryEditor personaId={personaId} paths={row.gallery_urls} onChange={(next) => { patch({ gallery_urls: next }); save("gallery", { gallery_urls: next }); }} />
    </div>

    <div className="filter-block">
      <div className="admin-section-head"><strong>Ảnh khoảnh khắc</strong></div>
      <ImageMomentsEditor personaId={personaId} />
    </div>

    <div className="filter-block">
      <div className="admin-section-head"><strong>Video giới thiệu</strong>{savedChip("video")}</div>
      <VideoEditor personaId={personaId} path={row.intro_video_url} onChange={(next) => { patch({ intro_video_url: next }); save("video", { intro_video_url: next }); }} />
    </div>


    <div className="filter-block">
      <div className="admin-section-head"><strong>Xóa nhân vật</strong></div>
      {!confirmDelete
        ? <Button variant="outline" onClick={() => setConfirmDelete(true)}><Trash2 /> Xóa nhân vật</Button>
        : <div className="admin-field">
            <p className="text-sm text-muted-foreground">
              {row.is_seed
                ? `Đây là nhân vật gốc. Gõ đúng tên "${row.name}" để xác nhận xóa.`
                : `Xóa "${row.name}" vĩnh viễn? Thao tác này không hoàn tác được.`}
            </p>
            {row.is_seed && <Input value={confirmName} onChange={(event) => setConfirmName(event.target.value)} placeholder={row.name} />}
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => { setConfirmDelete(false); setConfirmName(""); }}>Hủy</Button>
              <Button variant="destructive" disabled={row.is_seed && confirmName.trim() !== row.name} onClick={removePersona}>Xóa vĩnh viễn</Button>
            </div>
          </div>}
    </div>

    {preview && <div className="sheet-backdrop" onClick={() => setPreview(false)}>
      <div className="preview-frame" onClick={(event) => event.stopPropagation()}>
        <PersonaIntro persona={row} preview />
        <Button variant="outline" className="w-full" onClick={() => setPreview(false)}>Đóng xem trước</Button>
      </div>
    </div>}
  </section>;
}
