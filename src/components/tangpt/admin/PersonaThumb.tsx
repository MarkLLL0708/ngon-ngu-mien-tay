import { useMediaUrl } from "@/lib/tangpt-personas";

export function PersonaThumb({ path, name }: { path: string; name: string }) {
  const url = useMediaUrl(path);
  if (!url) return <div className="admin-thumb admin-thumb-empty"><span>{name[0] ?? "?"}</span></div>;
  return <img className="admin-thumb" src={url} alt={name} />;
}
