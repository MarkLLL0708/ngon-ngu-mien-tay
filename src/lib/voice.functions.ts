import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { buildStyleInstruction, regionFallbacks, type PersonaGender, type Region } from "./voice-style";
import { ACTIVE_VOICE_PROVIDERS } from "./tangpt-config";

export type VoiceTtsInput = {
  text: string;
  companion_id?: string;
  profile_id?: string;
  region?: Region;
  persona_gender?: PersonaGender;
  age_vibe?: "genz" | "27_35";
  late_night?: boolean;
};

export type VoiceTtsPayload = {
  audio_base64: string;
  content_type: string;
  profile_id: string;
  provider: string;
  latency_ms: number;
};

export class VoiceTtsError extends Error {
  constructor(public code: "missing_key" | "no_profile" | "bad_voice_id" | "provider_failed" | "empty_text") {
    super(code);
  }
}

type ProfileRow = {
  id: string;
  provider: string;
  voice_id: string;
  persona_gender: string;
  region: string;
  age_vibe: string;
  style_prompt: string;
  speed: number | string;
  active: boolean;
};

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export const voiceTts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: VoiceTtsInput) => input)
  .handler(async ({ data, context }): Promise<VoiceTtsPayload> => {
    const text = (data.text ?? "").trim().slice(0, 900);
    if (!text) throw new VoiceTtsError("empty_text");

    const { supabase } = context;
    let gender: PersonaGender = data.persona_gender ?? "female";
    let region: Region = data.region ?? "south";
    let ageVibe = data.age_vibe ?? "genz";
    let profile: ProfileRow | null = null;

    if (data.companion_id) {
      const { data: companion } = await supabase
        .from("companions")
        .select("voice_profile_id, persona_gender, region, age_vibe")
        .eq("id", data.companion_id)
        .maybeSingle();
      if (companion) {
        gender = (companion.persona_gender as PersonaGender) || gender;
        region = (companion.region as Region) || region;
        ageVibe = (companion.age_vibe as typeof ageVibe) || ageVibe;
        if (companion.voice_profile_id) {
          const { data: row } = await supabase
            .from("voice_profiles")
            .select("*")
            .eq("id", companion.voice_profile_id)
            .eq("active", true)
            .in("provider", ACTIVE_VOICE_PROVIDERS)
            .maybeSingle();
          profile = (row as ProfileRow | null) ?? null;
        }
      }
    }

    if (!profile && data.profile_id) {
      const { data: row } = await supabase.from("voice_profiles").select("*").eq("id", data.profile_id).in("provider", ACTIVE_VOICE_PROVIDERS).maybeSingle();
      profile = (row as ProfileRow | null) ?? null;
    }

    if (!profile) {
      const regions = regionFallbacks(region);
      const { data: rows } = await supabase
        .from("voice_profiles")
        .select("*")
        .eq("active", true)
        .eq("persona_gender", gender)
        .in("region", regions)
        .in("provider", ACTIVE_VOICE_PROVIDERS);
      const list = (rows ?? []) as ProfileRow[];
      const usable = list.filter((row) => row.voice_id && row.voice_id !== "REPLACE_WITH_VOICE_ID");
      const pool = usable.length ? usable : list;
      const score = (row: ProfileRow) =>
        (row.region === region ? 2 : 0) + (row.age_vibe === ageVibe ? 1 : 0);
      profile = pool.sort((a, b) => score(b) - score(a))[0] ?? null;
    }

    if (!profile) throw new VoiceTtsError("no_profile");

    const { getAdapter, adapterReady, VoiceError, withLateNight } = await import("./voice-tts.server");
    if (!adapterReady(profile.provider)) throw new VoiceTtsError("missing_key");

    const lateNight = data.late_night === true;
    const style = withLateNight(
      buildStyleInstruction(
        (profile.persona_gender as PersonaGender) || gender,
        (profile.region as Region) || region,
        profile.style_prompt ?? "",
      ),
      lateNight,
    );

    const started = Date.now();
    try {
      const result = await getAdapter(profile.provider).synthesize({
        text,
        voice_id: profile.voice_id,
        style_prompt: style,
        speed: Number(profile.speed ?? 1) || 1,
        late_night: lateNight,
      });
      return {
        audio_base64: toBase64(result.bytes),
        content_type: result.contentType,
        profile_id: profile.id,
        provider: profile.provider,
        latency_ms: Date.now() - started,
      };
    } catch (error) {
      if (error instanceof VoiceError) throw new VoiceTtsError(error.code === "unknown_provider" ? "provider_failed" : error.code);
      console.error("voice-tts failed", error);
      throw new VoiceTtsError("provider_failed");
    }
  });
