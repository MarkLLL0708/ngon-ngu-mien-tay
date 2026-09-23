import { useRef, useState } from "react";
import { Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deletePersonaMedia, MAX_VIDEO_BYTES, uploadPersonaMedia, useMediaUrl, VIDEO_TYPES } from "@/lib/tangpt-personas";

export function VideoEditor({ personaId, path, onChange }: { personaId: string; path: string; onChange: (next: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [percent, setPercent] = useState<number | null>(null);
  const [error, setError] = useState("");
  const url = useMediaUrl(path);

  async function handleFile(file: File) {
    setError("");
    if (!VIDEO_TYPES.includes(file.type)) { setError("Chỉ nhận video mp4 hoặc webm."); return; }
    if (file.size > MAX_VIDEO_BYTES) { setError("Video lớn hơn 60MB."); return; }
    setPercent(0);
    try {
      const uploaded = await uploadPersonaMedia(personaId, file, setPercent);
      if (path) await deletePersonaMedia(path);
      onChange(uploaded);
    } catch { setError("Tải video thất bại."); }
    setPercent(null);
  }

  async function remove() {
    const old = path;
    onChange("");
    await deletePersonaMedia(old);
  }

  return <div className="admin-media">
    {url
      ? <video className="admin-video" src={url} controls playsInline muted loop />
      : <div className="upload-zone" onClick={() => inputRef.current?.click()}><Film /><span>Tải video giới thiệu (mp4, webm · tối đa 60MB)</span></div>}

    <input ref={inputRef} type="file" accept={VIDEO_TYPES.join(",")} hidden
      onChange={(event) => { const file = event.target.files?.[0]; if (file) handleFile(file); event.target.value = ""; }} />

    {percent !== null && <div className="upload-progress"><span>Đang tải</span><i style={{ width: `${percent}%` }} /><small>{percent}%</small></div>}
    {error && <p className="form-message">{error}</p>}

    {url && <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()}>Thay video</Button>
      <Button type="button" variant="outline" size="sm" onClick={remove}>Gỡ video</Button>
    </div>}
  </div>;
}
