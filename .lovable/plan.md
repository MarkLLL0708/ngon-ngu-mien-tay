# Mature adult companion conversation engine

## Goal
Replace the artificial PG-13 tone with a mature, emotionally intelligent Vietnamese adult-romance system while preserving all legitimate consent, age, exploitation, crisis, and anti-dependency safeguards.

## Changes
- Audit and remove only artificial PG-13/wholesome restrictions from companion prompts and related app text; keep image, minor, consent, coercion, exploitation, crisis, and AI-honesty protections.
- Add structured `romance_intensity` (0–6), `emotional_state`, `relationship_stage`, and `character_romance_style` context to each companion conversation.
- Store romance style with personas and companion snapshots so each character has a distinct romantic voice; derive safe defaults from existing personality data for current records.
- Evolve intensity gradually from conversation context, relationship stage, affection, personality, mood, and model-proposed deltas; allow natural de-escalation without jumping levels.
- Require every romantic persona to have an explicit adult age (18+) and enforce this when publishing or using a persona.
- Expand the system prompt with adult Vietnamese chemistry, initiative, emotional intimacy, region-aware language, personality-specific romance, and concise natural boundary handling.
- Keep existing memory, empathy, realism, image moments, regional slang, address pairs, structured multi-bubble output, and safety behavior intact.

## Technical details
- Add a migration for `personas.character_romance_style`, `companions.character_romance_style`, and `companions.romance_intensity`, including constraints/backfills and existing access grants.
- Extend persona admin editing and companion creation so romance style is persisted and snapshotted.
- Extend engine JSON with a bounded `romance_intensity_delta`; validate and clamp all model output server-side.
- Send explicit age, personality, region, relationship stage, emotional state, communication style, texting habits, boundaries, and intensity on every companion model request.
- Add automated prompt/engine coverage for at least 30 Vietnamese adult scenarios spanning regions, personalities, relationship stages, attraction, teasing, jealousy, tension, vulnerability, and passionate non-explicit conversation.

## Verification
- Run the focused scenario suite and static checks.
- Confirm all 30+ cases preserve adult-only, consent, non-coercion, non-dependency, regional, and gradual-intensity rules.
- Make a live companion request through the existing Lovable AI path and inspect the response.
- Verify the preview remains healthy and unchanged visually except for the new admin romance-style field.
