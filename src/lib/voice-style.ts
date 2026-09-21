// Shared, browser-safe helpers for building the spoken-style instruction.

export type Region = "north" | "south" | "central" | "mekong";
export type PersonaGender = "female" | "male" | "nonbinary";

const REGION_WORDS: Record<Region, { from: string; accent: string }> = {
  north: { from: "Hanoi in northern Vietnam", accent: "northern Hanoi" },
  south: { from: "Saigon in southern Vietnam", accent: "southern Saigon" },
  central: { from: "Hue and Da Nang in central Vietnam", accent: "central Vietnamese" },
  mekong: { from: "the Mekong Delta in western Vietnam", accent: "Mekong Delta" },
};

export function personWord(gender: PersonaGender): string {
  if (gender === "male") return "man";
  if (gender === "nonbinary") return "person";
  return "woman";
}

export function buildStyleInstruction(
  gender: PersonaGender,
  region: Region,
  profileStyle: string,
): string {
  const words = REGION_WORDS[region] ?? REGION_WORDS.south;
  const base = `Speak Vietnamese like a real young ${personWord(gender)} from ${words.from}, casual, warm and natural, with a ${words.accent} accent, relaxed pace, small natural pauses and breaths, never like a newsreader.`;
  const extra = profileStyle.trim();
  return extra ? `${base} ${extra}` : base;
}

// mekong falls back to southern voices when no mekong profile exists
export function regionFallbacks(region: Region): Region[] {
  return region === "mekong" ? ["mekong", "south"] : [region];
}
