import { Check, Landmark, Palmtree, Sailboat, Waves } from "lucide-react";
import { regions, type RegionKey } from "@/lib/tangpt-data";
import { useRegionTheme } from "./RegionTheme";
import { cn } from "@/lib/utils";

const icons = { bac: Landmark, nam: Palmtree, trung: Waves, tay: Sailboat };
export function RegionPicker({ compact = false }: { compact?: boolean }) {
  const { region, setRegion, city, setCity } = useRegionTheme();
  return <div className="space-y-4">
    <div className={cn("grid gap-3", compact ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2")}>
      {(Object.keys(regions) as RegionKey[]).map((key) => {
        const item = regions[key]; const Icon = icons[key]; const selected = region === key;
        return <button key={key} type="button" onClick={() => { setRegion(key); setCity(item.cities[0]); }} className={cn("region-card group", selected && "region-card-active")}>
          <span className="region-icon"><Icon /></span>
          <span className="min-w-0 text-left"><strong>{item.name}</strong><small>{item.vibe}</small></span>
          {selected && <Check className="ml-auto size-5 shrink-0 text-primary" />}
        </button>;
      })}
    </div>
    {!compact && <div className="flex flex-wrap gap-2">{regions[region].cities.map((name) => <button type="button" key={name} onClick={() => setCity(name)} className={cn("chip", city === name && "chip-active")}>{name}</button>)}</div>}
  </div>;
}
