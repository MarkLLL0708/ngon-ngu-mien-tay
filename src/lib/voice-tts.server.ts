// Server-only TTS provider adapters. Never imported by client code.

export type SynthesizeInput = {
  text: string;
  voice_id: string;
  style_prompt: string;
  speed: number;
  late_night: boolean;
};

export type SynthesizeResult = { bytes: Uint8Array; contentType: string };

export type VoiceAdapter = {
  key: string;
  envKeys: string[];
  synthesize: (input: SynthesizeInput) => Promise<SynthesizeResult>;
};

export class VoiceError extends Error {
  constructor(public code: "missing_key" | "bad_voice_id" | "provider_failed" | "unknown_provider", message?: string) {
    super(message ?? code);
  }
}

export const LATE_NIGHT_SPEED = 0.93;
export const LATE_NIGHT_STYLE = "softer and slightly slower";

export function effectiveSpeed(speed: number, lateNight: boolean): number {
  const base = Number.isFinite(speed) && speed > 0 ? speed : 1;
  const value = lateNight ? base * LATE_NIGHT_SPEED : base;
  return Math.min(1.6, Math.max(0.5, Number(value.toFixed(3))));
}

export function withLateNight(style: string, lateNight: boolean): string {
  const clean = style.trim();
  if (!lateNight) return clean;
  return clean ? `${clean}, ${LATE_NIGHT_STYLE}` : LATE_NIGHT_STYLE;
}

function env(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : undefined;
}

function assertVoiceId(voiceId: string) {
  if (!voiceId || voiceId === "REPLACE_WITH_VOICE_ID") {
    throw new VoiceError("bad_voice_id", "Voice profile still holds a placeholder voice id.");
  }
}

async function bodyBytes(response: Response, provider: string): Promise<Uint8Array> {
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error(`${provider} tts error`, response.status, detail.slice(0, 500));
    throw new VoiceError("provider_failed", `${provider} returned ${response.status}`);
  }
  return new Uint8Array(await response.arrayBuffer());
}

/* ---------------- Vbee (request -> poll result) ---------------- */

const vbee: VoiceAdapter = {
  key: "vbee",
  envKeys: ["VBEE_API_KEY", "VBEE_APP_ID"],
  async synthesize({ text, voice_id, speed, late_night }) {
    const token = env("VBEE_API_KEY");
    const appId = env("VBEE_APP_ID");
    if (!token || !appId) throw new VoiceError("missing_key", "VBEE_API_KEY and VBEE_APP_ID are required.");
    assertVoiceId(voice_id);

    const create = await fetch("https://api.vbee.vn/v1/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, "App-Id": appId },
      body: JSON.stringify({
        text,
        voiceCode: voice_id,
        mode: "async",
        outputFormat: "mp3",
        bitrate: 128,
        sampleRate: 24000,
        speed: effectiveSpeed(speed, late_night),
      }),
    });
    if (!create.ok) {
      const detail = await create.text().catch(() => "");
      console.error("vbee create error", create.status, detail.slice(0, 500));
      throw new VoiceError("provider_failed", `vbee returned ${create.status}`);
    }
    const created = (await create.json()) as { requestId?: string; result?: { request_id?: string } };
    const requestId = created.requestId ?? created.result?.request_id;
    if (!requestId) throw new VoiceError("provider_failed", "vbee did not return a request id.");

    let audioLink = "";
    for (let attempt = 0; attempt < 30; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, attempt === 0 ? 400 : 700));
      const poll = await fetch(`https://api.vbee.vn/v1/tts/requests/${requestId}`, {
        headers: { Authorization: `Bearer ${token}`, "App-Id": appId },
      });
      if (!poll.ok) continue;
      const payload = (await poll.json()) as {
        status?: string;
        audioLink?: string;
        result?: { status?: string; audio_link?: string };
      };
      const status = (payload.status ?? payload.result?.status ?? "").toUpperCase();
      const link = payload.audioLink ?? payload.result?.audio_link ?? "";
      if (link) { audioLink = link; break; }
      if (status === "FAILURE" || status === "FAILED" || status === "ERROR") {
        throw new VoiceError("provider_failed", "vbee synthesis failed.");
      }
    }
    if (!audioLink) throw new VoiceError("provider_failed", "vbee timed out before returning audio.");

    const audio = await fetch(audioLink);
    const bytes = await bodyBytes(audio, "vbee");
    return { bytes, contentType: "audio/mpeg" };
  },
};

/* ---------------- Cartesia Sonic ---------------- */

const cartesia: VoiceAdapter = {
  key: "cartesia",
  envKeys: ["CARTESIA_API_KEY"],
  async synthesize({ text, voice_id, speed, late_night }) {
    const key = env("CARTESIA_API_KEY");
    if (!key) throw new VoiceError("missing_key", "CARTESIA_API_KEY is required.");
    assertVoiceId(voice_id);

    const response = await fetch("https://api.cartesia.ai/tts/bytes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": key,
        "Cartesia-Version": "2025-04-16",
      },
      body: JSON.stringify({
        // sonic-3 is the model that supports Vietnamese; sonic-2/turbo reject language "vi".
        model_id: "sonic-3",
        transcript: text,
        voice: { mode: "id", id: voice_id },
        language: "vi",
        speed: effectiveSpeed(speed, late_night) < 1 ? "slow" : "normal",
        output_format: { container: "wav", encoding: "pcm_s16le", sample_rate: 44100 },
      }),
    });
    const bytes = await bodyBytes(response, "cartesia");
    return { bytes, contentType: "audio/wav" };
  },
};

/* ---------------- Google Gemini TTS ---------------- */

function wavFromPcm(pcm: Uint8Array, sampleRate = 24000, channels = 1, bitsPerSample = 16): Uint8Array {
  const blockAlign = (channels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const out = new Uint8Array(44 + pcm.length);
  const view = new DataView(out.buffer);
  const ascii = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i += 1) view.setUint8(offset + i, value.charCodeAt(i));
  };
  ascii(0, "RIFF");
  view.setUint32(4, 36 + pcm.length, true);
  ascii(8, "WAVE");
  ascii(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  ascii(36, "data");
  view.setUint32(40, pcm.length, true);
  out.set(pcm, 44);
  return out;
}

const gemini: VoiceAdapter = {
  key: "gemini",
  envKeys: ["GEMINI_API_KEY"],
  async synthesize({ text, voice_id, style_prompt, late_night }) {
    const key = env("GEMINI_API_KEY");
    if (!key) throw new VoiceError("missing_key", "GEMINI_API_KEY is required.");
    assertVoiceId(voice_id);

    const instruction = withLateNight(style_prompt, late_night);
    const prompt = instruction ? `${instruction}\n\n${text}` : text;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice_id } } },
          },
        }),
      },
    );
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error("gemini tts error", response.status, detail.slice(0, 500));
      throw new VoiceError("provider_failed", `gemini returned ${response.status}`);
    }
    const payload = (await response.json()) as {
      candidates?: { content?: { parts?: { inlineData?: { data?: string; mimeType?: string } }[] } }[];
    };
    const part = payload.candidates?.[0]?.content?.parts?.find((item) => item.inlineData?.data);
    const base64 = part?.inlineData?.data;
    if (!base64) throw new VoiceError("provider_failed", "gemini returned no audio.");
    const binary = atob(base64);
    const pcm = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) pcm[i] = binary.charCodeAt(i);
    const rate = Number(/rate=(\d+)/.exec(part?.inlineData?.mimeType ?? "")?.[1] ?? 24000);
    return { bytes: wavFromPcm(pcm, rate), contentType: "audio/wav" };
  },
};

/* ---------------- ElevenLabs ---------------- */

const elevenlabs: VoiceAdapter = {
  key: "elevenlabs",
  envKeys: ["ELEVENLABS_API_KEY"],
  async synthesize({ text, voice_id, speed, late_night }) {
    const key = env("ELEVENLABS_API_KEY");
    if (!key) throw new VoiceError("missing_key", "ELEVENLABS_API_KEY is required.");
    assertVoiceId(voice_id);

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice_id)}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "xi-api-key": key },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: late_night ? 0.6 : 0.5,
            similarity_boost: 0.75,
            style: 0,
            use_speaker_boost: true,
            speed: effectiveSpeed(speed, late_night),
          },
        }),
      },
    );
    const bytes = await bodyBytes(response, "elevenlabs");
    return { bytes, contentType: "audio/mpeg" };
  },
};

export const ADAPTERS: Record<string, VoiceAdapter> = { vbee, cartesia, gemini, elevenlabs };

export function getAdapter(provider: string): VoiceAdapter {
  const adapter = ADAPTERS[provider];
  if (!adapter) throw new VoiceError("unknown_provider", `No adapter for provider "${provider}".`);
  return adapter;
}

export function adapterReady(provider: string): boolean {
  const adapter = ADAPTERS[provider];
  if (!adapter) return false;
  return adapter.envKeys.every((name) => !!env(name));
}
