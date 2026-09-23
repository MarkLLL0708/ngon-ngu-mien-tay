import { Badge } from "@/components/ui/badge";
import { useMediaUrl, type PersonaRow } from "@/lib/tangpt-personas";
import { cn } from "@/lib/utils";

export function PersonaCard({ persona, selected, onSelect }: { persona: PersonaRow; selected?: boolean; onSelect: () => void }) {
  const thumb = useMediaUrl(persona.gallery_urls[0] ?? "");
  return <button type="button" onClick={onSelect} className={cn("persona-card", selected && "persona-card-active")}>
    {thumb
      ? <img className="persona-card-photo" src={thumb} alt={persona.name} />
      : <div className="avatar-orbit"><span>{persona.name[0]}</span></div>}
    <div className="flex items-center gap-2">
      <h3 className="text-lg font-bold">{persona.name}{persona.age_vibe ? `, ${persona.age_vibe}` : ""}</h3>
      <Badge variant="secondary" className="rounded-full text-[10px]">Nhân vật AI</Badge>
    </div>
    <p className="text-sm text-muted-foreground">{[persona.job, persona.city].filter(Boolean).join(" · ")}</p>
    <p className="line-clamp-2 min-h-10 text-sm leading-5 text-foreground/85">{persona.backstory || persona.personality}</p>
    <div className="mt-auto flex flex-wrap gap-1.5">{persona.tags.slice(0, 3).map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>
  </button>;
}
