# Remove all user-facing voice and call features

## Scope
- Convert companion chat to text-only by removing the call button, call-screen state/import/render path, automatic voice-message assignment, audio playback hooks, and voice-message controls.
- Keep image upload, text composer, companion replies, memory, welcome-back behavior, menus, limits, and all existing backend/data behavior unchanged.
- Remove the `/app/voice-lab` route file so the URL is no longer registered or reachable.
- Preserve the dormant voice implementation files and database fields for possible future reuse, but ensure no active user-facing module imports or invokes them.
- Remove unused voice/call CSS so chat spacing collapses cleanly, while leaving the landing-page phone mockup styling unchanged.

## Verification
- Search the active route and component graph for voice/call imports, controls, labels, and network invocations.
- Open a companion chat and verify the header contains only back, identity, and menu controls; the composer contains image, text, and send controls only.
- Send a text message and confirm normal text replies, no audio requests, no voice-provider calls, and no leftover header/composer gaps.
- Confirm `/app/voice-lab` is unavailable and verify desktop/mobile layout plus the latest build status.

## Technical details
- `CallScreen`, `VoiceLab`, `voice-player`, `voice.functions`, `voice-style`, and provider adapters remain archived source code but become unreachable from the generated application route/component graph.
- Existing voice tables, columns, migrations, and provider secrets remain untouched.
