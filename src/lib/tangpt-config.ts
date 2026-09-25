// Central switch for guest/test mode.
// Set to false to restore the full login flow (login page, route guards, normal limits).
export const TEST_GUEST_MODE = true;

// Temporary on-screen debug panel (errors, route, session, overlays, navigation).
export const DEBUG = TEST_GUEST_MODE;

// Minimum hours since the last message before a welcome-back greeting is sent.
// Lower this (e.g. 0.02) to test the greeting quickly.
export const WELCOME_BACK_HOURS = 6;

// Archived voice/call feature. Keep false until the feature is deliberately rebuilt.
export const VOICE_FEATURE_ENABLED = false;

// Voice providers currently in use. Set to ["cartesia", "elevenlabs", ...] to enable more.
// Only profiles from these providers are selectable/playable; other adapters stay dormant.
export const ACTIVE_VOICE_PROVIDERS: string[] = ["cartesia"];

// Model comparison. null = default (openai/gpt-6-astra) for everyone.
// Setting a model id here switches companion replies for ALL users — prefer the
// per-admin session override on /app/admin/personas, which only affects your own messages.
export const TEST_MODEL_OVERRIDE: string | null = null;

// Models the admin override may pick. Claude models go through /v1/messages.
export const COMPARE_MODELS: string[] = [
  "anthropic/claude-sonnet-5",
  "anthropic/claude-opus-5",
  "anthropic/claude-opus-5-5",
  "anthropic/claude-fable-5-1",
  "anthropic/claude-haiku-4-5",
];

export const MODEL_OVERRIDE_STORAGE_KEY = "tangpt-model-override";

/** Admin's per-session override (browser only). */
export function readModelOverride(): string | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(MODEL_OVERRIDE_STORAGE_KEY);
  return value && COMPARE_MODELS.includes(value) ? value : null;
}

