import { useRef, useState } from "react";
import { Film, ImagePlus, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  deletePersonaMedia, IMAGE_TYPES, MAX_IMAGE_BYTES, MAX_VIDEO_BYTES, uploadPersonaMedia, VIDEO_TYPES, type PersonaRow,
} from "@/lib/tangpt-personas";

type Item = { name: string; percent: number; status: "wait" | "up" | "done" | "fail"; note?: string };

/** Pick a character, then choose photos and videos straight from the device's files. */
export function MediaUploadPanel({ personas, onUpdated }: { personas: PersonaRow[]; onUpdated: (row: PersonaRow) => void }) {
  const [personaId, setPersonaId] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);
  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const persona = personas.find((row) => row.id === personaId);

  function update(index: number, patch: Partial<Item>) {
    setItems((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  async function handle(files: FileList) {
    if (!persona || busy) return;
    const list = Array.from(files);
    setItems(list.map((file) => ({ name: file.name, percent: 0, status: "wait" })));
    setBusy(true);
    const gallery = [...persona.gallery_urls];
    let video = persona.intro_video_url;
    const oldVideo = video;
    let ok = 0;
    for (const [index, file] of list.entries()) {
      const isImage = IMAGE_TYPES.includes(file.type);
      const isVideo = VIDEO_TYPES.includes(file.type);
      if (!isImage && !isVideo) { update(index, { status: "fail", note: "Định dạng không hỗ trợ" }); continue; }
      if (file.size > (isImage ? MAX_IMAGE_BYTES : MAX_VIDEO_BYTES)) {
        update(index, { status: "fail", note: isImage ? "Ảnh lớn hơn 8MB" : "Video lớn hơn 60MB" }); continue;
      }
      update(index, { status: "up" });
      try {
        const path = await uploadPersonaMedia(persona.id, file, (percent) => update(index, { percent }));
        if (isImage) gallery.push(path); else video = path;
        update(index, { status: "done", percent: 100 });
        ok += 1;
      } catch { update(index, { status: "fail", note: "Tải thất bại" }); }
    }
    if (ok > 0) {
      const { error } = await supabase.from("personas")
        .update({ gallery_urls: gallery, intro_video_url: video, updated_at: new Date().toISOString() }).eq("id", persona.id);
      if (error) toast.error("Không lưu được vào nhân vật");
      else {
        if (oldVideo && oldVideo !== video) await deletePersonaMedia(oldVideo);
        onUpdated({ ...persona, gallery_urls: gallery, intro_video_url: video });
        toast.success(`Đã tải lên ${ok} tệp cho ${persona.name}`);
      }
    }
    setBusy(false);
  }

  return <div className="filter-block">
    <div className="admin-section-head"><strong>Tải ảnh & video lên</strong></div>
    <div className="admin-field">
      <label htmlFor="media-persona">Chọn nhân vật</label>
      <select id="media-persona" className="admin-select" value={personaId} onChange={(event) => { setPersonaId(event.target.value); setItems([]); }}>
        <option value="">— Chọn nhân vật —</option>
        {personas.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
      </select>
    </div>
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="gradient" disabled={!persona || busy} onClick={() => imageRef.current?.click()}><ImagePlus /> Chọn ảnh</Button>
      <Button type="button" variant="outline" disabled={!persona || busy} onClick={() => videoRef.current?.click()}><Film /> Chọn video giới thiệu</Button>
    </div>
    <p className="text-sm text-muted-foreground">
      <Upload className="inline size-4" /> Ảnh jpg/png/webp tối đa 8MB, chọn được nhiều ảnh cùng lúc. Video mp4/webm tối đa 60MB sẽ thay video giới thiệu hiện tại.
    </p>
    <input ref={imageRef} type="file" accept={IMAGE_TYPES.join(",")} multiple hidden
      onChange={(event) => { if (event.target.files?.length) void handle(event.target.files); event.target.value = ""; }} />
    <input ref={videoRef} type="file" accept={VIDEO_TYPES.join(",")} hidden
      onChange={(event) => { if (event.target.files?.length) void handle(event.target.files); event.target.value = ""; }} />
    {items.map((item, index) => <div className="upload-progress" key={`${item.name}-${index}`}>
      <span>{item.name}</span><i style={{ width: `${item.percent}%` }} />
      <small>{item.status === "fail" ? item.note : item.status === "done" ? "Xong" : `${item.percent}%`}</small>
    </div>)}
  </div>;
}
