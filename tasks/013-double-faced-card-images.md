# 013 — Support double-faced card images and flipping

**Labels:** `bug`, `feature`, `area:card-display`, `priority:medium`
**Estimate:** M
**Depends on:** none

## Summary

`IDEAS.md` asks for dual-sided cards to be flippable to see both faces. Investigating found this is actually a live data-correctness bug, not just a missing nice-to-have: the app's `ScryfallCard` type doesn't model double-faced cards at all, so any DFC added to a deck today likely renders with a broken/undefined image.

## Background

`src/types/index.ts:13` — `ScryfallCard` only declares a flat `image_uris?: { small; normal; large }`. Scryfall omits top-level `image_uris` for most double-faced cards; image data instead lives per-face under `card_faces[n].image_uris`. Nine components read `card.image_uris` directly with no fallback: `CardGallery.tsx`, `SwapSidebar.tsx`, `DeckCard.tsx`, `VersionCompare.tsx`, `SelectedCategoryModal.tsx`, `HandSimulator.tsx`, `WishlistAddPanel.tsx`, `WishlistCard.tsx`, `CardImageTooltip.tsx`.

## Acceptance Criteria

- [ ] Extend the `ScryfallCard` type to model `card_faces` (each with its own `image_uris`, `name`, `mana_cost`, `oracle_text`, etc., per Scryfall's actual response shape).
- [ ] Add a single shared image-resolution helper (e.g. `getCardImageUrl(card, face?)`) that falls back to `card_faces[0].image_uris` when top-level `image_uris` is absent, and use it everywhere the nine components above currently read `card.image_uris` directly — this is the highest-value part of the fix, since it closes the broken-image bug even before flip UI exists.
- [ ] Add a flip control (e.g. a button/icon overlay on the card image) to at least the primary card-display surfaces (`CardGallery`, deck detail card view, `CardImageTooltip`) that swaps between `card_faces[0]` and `card_faces[1]` — decide with the product owner whether every surface listed above needs flip UI or just the main ones, to keep this from ballooning.
- [ ] Non-DFC cards are unaffected (no visual or behavioral regression for the common single-faced case).
- [ ] Verify against a couple of real DFC commanders/cards (e.g. a modal double-faced card, a transform card) in the dev environment.

## Files / Areas Touched

- `src/types/index.ts`
- New shared helper, likely in `src/utils/utils.ts` or a new `src/utils/cardImage.ts`
- `CardGallery.tsx`, `SwapSidebar.tsx`, `DeckCard.tsx`, `VersionCompare.tsx`, `SelectedCategoryModal.tsx`, `HandSimulator.tsx`, `WishlistAddPanel.tsx`, `WishlistCard.tsx`, `CardImageTooltip.tsx`

## Out of Scope

- Flip UI on every single surface listed above on day one — ship the broken-image fix everywhere, then flip UI on the primary surfaces, then expand if wanted.
- Any animation/transition polish on the flip beyond a basic, functional toggle.
