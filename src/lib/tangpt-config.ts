// Central switch for guest/test mode.
// Set to false to restore the full login flow (login page, route guards, normal limits).
export const TEST_GUEST_MODE = true;

// Temporary on-screen debug panel (errors, route, session, overlays, navigation).
export const DEBUG = TEST_GUEST_MODE;

// Minimum hours since the last message before a welcome-back greeting is sent.
// Lower this (e.g. 0.02) to test the greeting quickly.
export const WELCOME_BACK_HOURS = 6;

// Voice providers currently in use. Set to ["cartesia", "elevenlabs", ...] to enable more.
// Only profiles from these providers are selectable/playable; other adapters stay dormant.
export const ACTIVE_VOICE_PROVIDERS: string[] = ["cartesia"];

