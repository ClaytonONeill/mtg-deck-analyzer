# 015 — Multi-key sub-sorting in gallery and wishlist

**Labels:** `enhancement`, `area:sorting`, `priority:low`
**Estimate:** S
**Depends on:** none

## Summary

`IDEAS.md` asks to sort by multiple properties at once (e.g. Type then Color). Both existing sort implementations are single-key only, and — despite being nearly identical in shape — are separately hand-rolled rather than sharing a util.

## Background

- `src/features/gallery/components/CardGallery.tsx:41-49,74-75,118-134` — `SortKey = "type" | "color" | "cmc" | "name"`, one `sort`/`sortDir` state, a single `switch` comparator.
- `src/pages/WishlistPage.tsx:23-24,74-100,144-145` — its own `SortKey = "name" | "cmc" | "color" | "type" | "date"`, its own `sortEntries` function, the same single-key `switch` pattern.

Filtering *is* already shared, via `src/components/FilterSection/FilterSection.tsx` (per `CLAUDE.md`) — sorting is the one piece of this logic that never got consolidated. `tasks/009` (testing foundation, Phase 1) also separately proposes extracting `WishlistPage`'s inline `sortEntries` to `src/features/wishlist/utils/` for testability — do that extraction as part of this task rather than duplicating the move.

## Acceptance Criteria

- [ ] Extract a single shared multi-key sort util (e.g. `sortCards(cards, keys: SortKey[], dir)`) that both `CardGallery` and `WishlistPage` use, replacing their separate hand-rolled comparators.
- [ ] UI supports selecting a primary sort key plus at least one secondary tiebreaker key (e.g. "Type, then Color") — a simple two-level picker is enough, doesn't need to be arbitrarily deep.
- [ ] Existing single-key sort behavior is preserved exactly when no secondary key is chosen (no regression to current default sorting).
- [ ] If `009`'s Phase 1 hasn't landed yet, this task's extraction satisfies that overlap — no need to redo the move later.

## Files / Areas Touched

- `src/features/gallery/components/CardGallery.tsx`
- `src/pages/WishlistPage.tsx`
- New shared util, likely `src/utils/sortCards.ts` or `src/features/wishlist/utils/`

## Out of Scope

- Changing what's filterable — this is sort-only.
- An arbitrarily-deep sort-key stack (>2 levels) — not asked for and adds UI complexity out of proportion to the app's scale.
