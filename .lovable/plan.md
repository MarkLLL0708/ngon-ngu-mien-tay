# Legal pages, consent, and account deletion

## What will change
- Replace the existing short legal placeholders with complete Vietnamese and English Terms and Privacy documents based only on the supplied points.
- Keep a prominent `[CẦN LUẬT SƯ XEM LẠI] / [NEEDS LAWYER REVIEW]` notice at the top of both pages.
- Add the existing VI/EN language switch and route-specific page metadata.
- Require explicit agreement to both policies before email/password sign-up, with links that open the two policy pages.
- Add Terms and Privacy links to the shared landing and signed-in app footer areas.
- Add a bilingual permanent account deletion action on the Me page with a destructive confirmation step.

## Account deletion behavior
- Use an authenticated server-side action so a user can delete only their own account.
- Delete the user-owned profile, companions, messages, memories, reply history, and related companion history in a single database function before removing the login identity.
- Preserve shared/public persona content and media because it is not owned by the deleting user.
- Sign the browser out, clear local TánGPT session data, and return to the public landing page after success.

## Validation
- Verify the lawyer-review notice and language switching on `/terms` and `/privacy`.
- Verify sign-up cannot submit until consent is checked and both links work.
- Verify the confirmation can be cancelled and account deletion is not triggered accidentally.
- Check the landing, app, and Me page on mobile and at 1280px without changing the existing visual direction.
