# Fix Me selector and AI Companion layout

## What will change
- Make each combined connection card save immediately when tapped, keeping the selected highlight and showing a bilingual success toast only after the profile update succeeds.
- Update the in-app profile state immediately so persona filtering and reply-helper defaults react without a reload.
- Keep existing conversations sorted by latest activity and show that section only when chats exist.
- Always show a second discovery section containing only personas the user has not started, filtered by the current region and target gender.
- Remove the add-persona button and the hidden picker state; existing chats and discovery will appear together in one scroll.

## Technical details
- Add a small shared profile-change notification so active profile consumers refresh immediately after a saved selection.
- Include each companion's persona identifier when loading chats to exclude started personas reliably.
- Preserve current routes: chat rows open the chat, persona cards open the existing intro screen.
- Verify save behavior, bilingual toast, both-section layout, zero-chat behavior, and mobile width without changing the visual system.
