# Companion-only landing copy update

## What will change
- Add `REPLY_HELPER_ENABLED = false` to the shared configuration, keeping the reply-helper code archived rather than deleting it.
- Remove reply-helper promotion and access from the visible app experience while preserving the existing companion experience and styling.
- Keep the landing page’s current visual language, layout conventions, and phone mockup format.
- Replace the hero headline and supporting copy with the supplied Vietnamese and English text; keep the primary button unchanged.
- Add one full-width, high-contrast emotional text band with no button.
- Add the supplied energetic regional-companion copy immediately before the existing final call-to-action band.
- Keep the region demo, “Cách hoạt động,” “Vì sao khác biệt,” footer disclosure, respectful-communication line, and all visible AI labels.
- Update the final call-to-action line while retaining “Dùng thử miễn phí / Try it free.”

## Validation
- Check Vietnamese and English variants on desktop and mobile.
- Confirm no reply-helper promotion remains visible, companion navigation still works, and AI disclosures remain visible.
- Confirm the preview builds without errors.

## Technical details
- Reuse existing design tokens and landing-page classes; add only semantic classes for the new emotional beat and companion close where needed.
- Preserve the archived reply-helper implementation behind the central feature flag.
