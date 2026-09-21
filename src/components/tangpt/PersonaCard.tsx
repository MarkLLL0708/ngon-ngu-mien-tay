import { Badge } from "@/components/ui/badge";
import type { Persona } from "@/lib/tangpt-data";
import { cn } from "@/lib/utils";

export function PersonaCard({ persona, selected, onSelect }: { persona: Persona; selected?: boolean; onSelect: () => void }) {
  return <button type="button" onClick={onSelect} className={cn("persona-card", selected && "persona-card-active")}>
    <div className="avatar-orbit"><span>{persona.name[0]}</span></div>
    <div className="flex items-center gap-2"><h3 className="text-lg font-bold">{persona.name}, {persona.age}</h3><Badge variant="secondary" className="rounded-full text-[10px]">Nhân vật AI</Badge></div>
    <p className="text-sm text-muted-foreground">{persona.job} · {persona.city}</p>
    <p className="line-clamp-2 min-h-10 text-sm leading-5 text-foreground/85">{persona.blurb}</p>
    <div className="mt-auto flex flex-wrap gap-1.5">{persona.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>
  </button>;
}
