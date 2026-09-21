import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { RegionKey } from "@/lib/tangpt-data";

type RegionContextValue = { region: RegionKey; setRegion: (region: RegionKey) => void; city: string; setCity: (city: string) => void };
const RegionContext = createContext<RegionContextValue | null>(null);

export function RegionThemeProvider({ children }: { children: ReactNode }) {
  const [region, setRegionState] = useState<RegionKey>("nam");
  const [city, setCityState] = useState("Sài Gòn");
  useEffect(() => {
    const saved = window.localStorage.getItem("tangpt-region") as RegionKey | null;
    const savedCity = window.localStorage.getItem("tangpt-city");
    if (saved && ["bac", "nam", "trung", "tay"].includes(saved)) setRegionState(saved);
    if (savedCity) setCityState(savedCity);
  }, []);
  const value = useMemo(() => ({
    region,
    city,
    setRegion: (next: RegionKey) => { setRegionState(next); window.localStorage.setItem("tangpt-region", next); },
    setCity: (next: string) => { setCityState(next); window.localStorage.setItem("tangpt-city", next); },
  }), [region, city]);
  return <RegionContext.Provider value={value}><div className="region-root" data-region={region}>{children}</div></RegionContext.Provider>;
}

export function useRegionTheme() {
  const value = useContext(RegionContext);
  if (!value) throw new Error("useRegionTheme phải nằm trong RegionThemeProvider");
  return value;
}
