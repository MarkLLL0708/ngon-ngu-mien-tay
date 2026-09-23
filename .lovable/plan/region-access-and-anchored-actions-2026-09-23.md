# Region access and anchored actions

## Scope
- Preserve all colors, typography, copy, data behavior, and overall visual styling.
- Change only layout and placement for region controls and primary actions.

## Region selector
- Add one reusable horizontal four-region chip bar using the existing region names and active-region styling.
- Place it directly below the page title on **Gợi ý** (`/app`), **Bạn gái AI** (`/app/ai`), and at the top of **Onboarding**.
- On narrow screens, keep the chips in one horizontal strip with contained horizontal scrolling; never allow page-level overflow.
- Remove the global top-right region button and its popover from the app header.
- Keep the region picker on **Tôi** unchanged as the secondary region setting.

## Anchored primary actions
- Restructure scrollable surfaces into a content area plus a bottom action area with a divider/top shadow and safe-area spacing.
- Keep the primary action continuously visible in:
  - every onboarding step: **Tiếp tục**, city continuation, age continuation, and **Bắt đầu**;
  - persona confirmation: **Bắt đầu nhắn tin**;
  - save-account modal: **Lưu tài khoản**;
  - upgrade/paywall modal: its primary upgrade action;
  - memory deletion confirmations: **Xóa**;
  - call consent: its confirmation action, if present.
- Secondary actions remain with the anchored area when they belong to the same decision.
- Let content scroll independently above the action area.

## Verification
- Test the affected flows at 360px width and confirm:
  - region chips fit in one contained row;
  - no page-level horizontal scrolling;
  - every primary action is visible immediately without scrolling.
- Recheck affected layouts at representative wider widths to ensure the existing desktop/tablet presentation remains intact.
- Confirm the preview builds without errors and report each changed screen and its final CTA position.

## Technical details
- Reuse the existing region state/context and Button component; no backend or data changes.
- Use shared CSS classes for scrollable bodies and sticky/fixed action bars with `env(safe-area-inset-bottom)`.
- Keep overlays below debug/error layers and above page navigation.
