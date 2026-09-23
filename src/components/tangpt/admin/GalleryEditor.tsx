import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { deletePersonaMedia, IMAGE_TYPES, MAX_IMAGE_BYTES, uploadPersonaMedia, useMediaUrls } from "@/lib/tangpt-personas";

type Progress = { name: string; percent: number };

export function GalleryEditor({ personaId, paths, onChange }: { personaId: string; paths: string[]; onChange: (next: string[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const urls = useMediaUrls(paths);

  async function handleFiles(files: FileList | File[]) {
    setError("");
    const list = Array.from(files);
    const accepted: File[] = [];
    for (const file of list) {
      if (!IMAGE_TYPES.includes(file.type)) { setError("Chỉ nhận ảnh jpg, png hoặc webp."); continue; }
      if (file.size > MAX_IMAGE_BYTES) { setError(`${file.name} lớn hơn 8MB.`); continue; }
      accepted.push(file);
    }
    if (accepted.length === 0) return;
    setProgress(accepted.map((file) => ({ name: file.name, percent: 0 })));
    const uploaded: string[] = [];
    for (const file of accepted) {
      try {
        const path = await uploadPersonaMedia(personaId, file, (percent) =>
          setProgress((current) => current.map((item) => (item.name === file.name ? { ...item, percent } : item))));
        uploaded.push(path);
      } catch { setError(`Tải ${file.name} thất bại.`); }
    }
    setProgress([]);
    if (uploaded.length > 0) onChange([...paths, ...uploaded]);
  }

  async function remove(index: number) {
    const path = paths[index] ?? "";
    onChange(paths.filter((_, i) => i !== index));
    await deletePersonaMedia(path);
  }

  function reorder(from: number, to: number) {
    if (from === to) return;
    const next = paths.slice();
    const moved = next.splice(from, 1)[0];
    if (moved === undefined) return;
    next.splice(to, 0, moved);
    onChange(next);
  }

  return <div className="admin-media">
    <div
      className={dragOver ? "upload-zone upload-zone-over" : "upload-zone"}
      onClick={() => inputRef.current?.click()}
      onDragOver={(event) => { event.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(event) => { event.preventDefault(); setDragOver(false); if (event.dataTransfer.files.length) handleFiles(event.dataTransfer.files); }}
    >
      <ImagePlus />
      <span>Kéo thả hoặc bấm để tải ảnh (jpg, png, webp · tối đa 8MB)</span>
    </div>
    <input ref={inputRef} type="file" accept={IMAGE_TYPES.join(",")} multiple hidden
      onChange={(event) => { if (event.target.files) handleFiles(event.target.files); event.target.value = ""; }} />

    {progress.map((item) => <div className="upload-progress" key={item.name}>
      <span>{item.name}</span><i style={{ width: `${item.percent}%` }} /><small>{item.percent}%</small>
    </div>)}
    {error && <p className="form-message">{error}</p>}

    <div className="gallery-grid">
      {paths.map((path, index) => <div
        className="gallery-item"
        key={path}
        draggable
        onDragStart={() => setDragIndex(index)}
        onDragOver={(event) => event.preventDefault()}
        onDrop={() => { if (dragIndex !== null) reorder(dragIndex, index); setDragIndex(null); }}
      >
        {urls[index] ? <img src={urls[index]} alt="" /> : <div className="gallery-item-empty" />}
        <button type="button" className="gallery-remove" aria-label="Xóa ảnh" onClick={() => remove(index)}><X /></button>
        <div className="gallery-order">
          <button type="button" aria-label="Sang trái" disabled={index === 0} onClick={() => reorder(index, index - 1)}>←</button>
          <span>{index + 1}</span>
          <button type="button" aria-label="Sang phải" disabled={index === paths.length - 1} onClick={() => reorder(index, index + 1)}>→</button>
        </div>
      </div>)}
    </div>
  </div>;
}
