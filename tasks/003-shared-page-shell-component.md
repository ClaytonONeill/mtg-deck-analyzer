# 003 — Extract a shared page-shell / loading component

**Labels:** `tech-debt`, `area:styling`, `priority:medium`
**Estimate:** S
**Depends on:** none (pairs well with #002 but doesn't require it)

## Summary

Every top-level page re-implements its own `min-h-screen` wrapper and loading state from scratch, with no shared component, which has let the background token and loading UI drift out of sync between pages for no functional reason.

## Background

Current state per page:

| Page | Background token | Loading spinner variant | Loading copy | Has a loading gate? |
|---|---|---|---|---|
| `HomePage.tsx` | `bg-base-100` | `loading-spinner` | "Loading decks..." | yes |
| `DeckDetailPage.tsx` | `bg-base-100` | `loading-spinner` | "Scanning the multiverse..." | yes |
| `DeckBuilderPage.tsx` | `bg-base-300` | `loading-ring` | "Loading deck..." | yes |
| `WishlistPage.tsx` | `bg-base-200` | `loading-spinner` | "Loading wishlist..." | yes |
| `ObjectivesPage.tsx` | `bg-base-300` | — | — | **no** — renders immediately with an empty `objectives` array until `useObjectives`'s fetch resolves, so it can flash an empty state on load |

None of this drift looks deliberate — it reads as five different people (or five different agent sessions) each having free-handed the same wrapper. `LoginPage.tsx` wasn't included in the audit that produced this list — check it too while doing this.

## Acceptance Criteria

- [ ] A single shared component (e.g. `src/components/PageShell` or similar — match this repo's existing `components/<Name>/<Name>.tsx` folder convention) provides the `min-h-screen` wrapper and a consistent loading state (spinner variant, copy pattern, background token).
- [ ] Pick one background token as the standard page background (recommend `bg-base-100`, since it's already used by the two pages a user sees most, `HomePage`/`DeckDetailPage`) and apply it everywhere via the shared component — or, if there's a deliberate reason for `DeckBuilderPage`/`ObjectivesPage` to look different, document that reason in the component instead of leaving it unexplained.
- [ ] `HomePage`, `DeckDetailPage`, `DeckBuilderPage`, `WishlistPage`, `ObjectivesPage` (and `LoginPage` if applicable) all use the shared component for their base wrapper + loading state.
- [ ] `ObjectivesPage` gets an actual loading gate matching the others, so it doesn't flash empty content before the first fetch resolves.
- [ ] Visually spot-check all five pages after the change — layout/spacing inside each page's `<main>`/content area should be unaffected; only the outer wrapper and loading state change.

## Files / Areas Touched

- New shared component under `src/components/`
- `src/pages/HomePage.tsx`, `DeckDetailPage.tsx`, `DeckBuilderPage.tsx`, `WishlistPage.tsx`, `ObjetivesPage.tsx`, `LoginPage.tsx`

## Out of Scope

- Changing per-page content/layout below the wrapper.
- Adding skeleton loading (that's a separate, larger idea already tracked in `IDEAS.md` under "Skeleton Loading" — don't fold it into this task).
