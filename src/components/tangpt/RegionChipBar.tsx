import { regions, type RegionKey } from "@/lib/tangpt-data";
import { useRegionTheme } from "./RegionTheme";

const regionKeys: RegionKey[] = ["bac", "nam", "trung", "tay"];

export function RegionChipBar({ onSelect }: { onSelect?: (region: RegionKey, city: string) => void }) {
  const { region, setRegion, setCity } = useRegionTheme();

  return <div className="region-chip-bar" aria-label="Region">
    {regionKeys.map((key) => <button
      type="button"
      key={key}
      className={region === key ? "chip chip-active" : "chip"}
      onClick={() => {
        const nextCity = regions[key].city;
        setRegion(key);
        setCity(nextCity);
        onSelect?.(key, nextCity);
      }}
    >{regions[key].name}</button>)}
  </div>;
}