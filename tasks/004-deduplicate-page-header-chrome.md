# 004 — De-duplicate in-page "back" header chrome

**Labels:** `tech-debt`, `area:styling`, `priority:low`
**Estimate:** S
**Depends on:** none

## Summary

The global `Header` (mounted once in `App.tsx`, above `<Routes>`) already provides top-level navigation, but three pages each additionally render their own independent sticky header bar with their own "Back" button, each implemented slightly differently.

## Background

- `src/components/Header/Header.tsx` — global header, always mounted: app title (click → home), nav buttons (Objectives/Wishlist/+ New Deck/Sign Out), theme selector, mobile hamburger menu. No back/context affordance — it's not aware of which page it's on beyond hiding the "current page" nav button.
- `src/pages/DeckBuilderPage.tsx` (lines ~63–100) — a second `<header className="navbar ...">` with its own hand-rolled inline-SVG back-chevron button ("Back to Decks").
- `src/pages/WishlistPage.tsx` (lines ~195–208) — a third sticky `<header>` with a text-arrow "← Back" button.
- `src/pages/DeckDetailPage.tsx` (lines ~232–245) — a fourth sticky bar with a `lucide-react` `ChevronLeft` "Back" button plus an "Edit Deck" button.

Three different back-button implementations doing the same job (`navigate("/")` or similar), each with its own markup/icon choice.

## Acceptance Criteria

- [ ] Decide (as a quick product/UX call, not just an engineering one — this changes visible chrome) whether the sub-page header/back-button belongs as a small reusable component (e.g. `PageHeader` with `title`/`onBack`/optional right-side actions like "Edit Deck") or whether it should be folded into `Header.tsx` itself so there's only ever one header bar rendered per page.
- [ ] Implement one shared pattern and apply it to `DeckBuilderPage`, `WishlistPage`, and `DeckDetailPage`.
- [ ] `DeckDetailPage`'s extra "Edit Deck" action in its header must still work after the change.
- [ ] Visually confirm no page ends up with two stacked/duplicate headers after the change.

## Files / Areas Touched

- `src/pages/DeckBuilderPage.tsx`
- `src/pages/WishlistPage.tsx`
- `src/pages/DeckDetailPage.tsx`
- Possibly `src/components/Header/Header.tsx`, or a new small shared component

## Out of Scope

- Redesigning the global `Header`'s nav/theme-selector/hamburger behavior.
- `ObjectivesPage.tsx`, which doesn't have this duplicate-header pattern — leave it alone.
