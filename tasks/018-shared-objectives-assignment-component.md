# 018 — Consolidate objectives-assignment UI into one shared component

**Labels:** `tech-debt`, `area:objectives`, `priority:medium`, `needs-product-input`
**Estimate:** M
**Depends on:** none, but touches the same `objectiveOverrides` model as [`007`](007-deck-version-editing-gaps.md) — coordinate ordering if both are in flight.

## Summary

`IDEAS.md`: "There currently exist two or three instances of [the objectives menu] with differing functionality, this is bad UX." Confirmed — there are actually four distinct patterns in the codebase, all built around the same `ObjectivePill` component but with different data shapes and interaction models.

## Background

- `src/features/gallery/components/CardGallery.tsx:274-303` — inline `+` dropdown per card, operates on `objectiveId: string` via `onAssign(cardId, objectiveId)`.
- `src/features/wishlist/components/WishlistCard.tsx:106-125` — separate "+ Objective" dropdown, operates on full `Objective` objects via `onAssignObjective(entryId, objective)` — a **different function signature/data model** than the Gallery one above, not just different markup.
- `src/features/deckVersions/hooks/useDeckVersions.ts:82-137` (`assignObjectiveToVersion`/`unassignObjectiveFromVersion`) — a third storage model: `objectiveOverrides` keyed by `cardId` on the version object, routed through `DeckDetailPage.tsx:207-221`'s `handleAssignObjective`/`handleUnassignObjective`, branching on whether `activeVersionId` is set.
- `src/features/objectives/components/ObjectiveManager.tsx` — a fourth surface, but it's CRUD for objective *definitions* (create/edit/delete), not assignment — worth keeping conceptually separate rather than folding into the same component.
- `src/features/gallery/components/SwapSidebar.tsx:96-107,358-380` — a read-only filter-by-objective usage, not assignment, but shares visual language with the above.

## Acceptance Criteria

- [ ] **Get product-owner input on target UX before building** — this task has a real design question buried in it (should assignment always look/feel identical regardless of context, or is some divergence between "assigning to a card in the base deck" vs. "assigning to a card within a specific version" intentional given the different underlying data model?).
- [ ] Extract one shared objective-assignment component (dropdown/menu + `ObjectivePill` rendering) that `CardGallery` and `WishlistCard` both use, unifying their two different callback signatures into one.
- [ ] Decide whether `useDeckVersions`'s version-scoped assignment can route through the same shared component (likely yes, with the component accepting an assign/unassign callback pair rather than assuming a single global objectives list) or whether its per-version-override semantics genuinely need to stay a separate path — document the decision in this file's Notes once made.
- [ ] `ObjectiveManager.tsx` (CRUD) is explicitly out of scope — confirm it isn't accidentally merged into the new shared component.

## Files / Areas Touched

- `src/features/gallery/components/CardGallery.tsx`, `SwapSidebar.tsx`
- `src/features/wishlist/components/WishlistCard.tsx`
- `src/features/deckVersions/hooks/useDeckVersions.ts`
- `src/pages/DeckDetailPage.tsx`
- New shared component, likely `src/features/objectives/components/ObjectiveAssignMenu.tsx`

## Out of Scope

- `ObjectiveManager.tsx` (objective definition CRUD) — different concern, not touched here.
- Changing the underlying `objectiveOverrides`-per-version data model — that's `007`'s territory if it turns out to need changing.
