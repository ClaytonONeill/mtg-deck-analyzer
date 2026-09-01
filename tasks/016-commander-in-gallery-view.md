# 016 — Show commander/partner cards in Gallery view

**Labels:** `enhancement`, `area:gallery`, `priority:low`
**Estimate:** XS
**Depends on:** none

## Summary

`IDEAS.md`: "Right now you can only see the cards within the deck but cannot see your own commander card [in Gallery view]." Confirmed accurate — the Gallery grid only renders the deck's 99 non-commander entries.

## Background

`src/features/gallery/components/CardGallery.tsx` — the `entries` prop (sourced from `DeckDetailPage.tsx:434-437`'s `displayDeck.entries`) never includes `Deck.commander`/`Deck.partner`, and the grid rendering (lines 216-330) has no separate slot for them either. Commander/partner *are* visible elsewhere in the app (the deck-identity header in `DeckDetailPage.tsx:266-274`, the sidebar badge in `DeckBuilderPage.tsx:271-288`) — just not inside the Gallery tab itself.

## Acceptance Criteria

- [x] Commander (and partner, if set) render in the Gallery grid — as a pinned/leading tile, or a visually distinct small section above the 99, so it stays clear it's not swappable/removable the way regular entries are.
- [x] Commander/partner tiles are visually distinguishable from regular entries (e.g. a badge or border), consistent with how they're marked elsewhere in the app.
- [x] Clicking the commander tile behaves sensibly given whatever click affordances (objective tagging, swap, zoom) the rest of the grid has — decide whether commander/partner should support those same actions or be display-only, and keep that decision consistent with existing surfaces (e.g. `SwapSidebar` shouldn't let you "swap out" your commander).
- [x] No change to `displayDeck.entries`'s actual contents/count — this is a display-only addition, not a change to what counts as a deck's 99 cards.

## Resolution

First pass rendered commander/partner as pinned tiles at the start of the grid; product-owner feedback after seeing it was that the commander doesn't need to share a view with the other 99 cards at all. Landed instead as a **"View Commander" button** next to the Filters button (only rendered when a commander is set) that opens the existing zoom `<dialog>` showing the commander (and partner, if set) full-size, side by side — no in-grid tile, no "Commander"/"Partner" text badge on the image, just the card(s). **Display-only**: no objective-assignment dropdown or Swap button — the data model has no per-card objective slot for commander/partner (`DeckEntry.objectiveIds` doesn't apply to them, they're plain `ScryfallCard`s on `Deck.commander`/`Deck.partner`), and swapping is explicitly out of scope. `CardGallery` takes optional `commander`/`partner` props; `DeckDetailPage` passes `displayDeck.commander`/`displayDeck.partner` (versions don't alter commander/partner, so this is equivalent to `activeDeck`'s).

Companion work: the hand simulator (`HandSimulator.tsx`) also gained a Command Zone — commander/partner are visible and castable there too (with a proper commander-tax mechanic), which was the original ask this task got picked up alongside. Its command-zone thumbnails also dropped their "CMDR"/"PTNR" badge for the same reason — redundant given the dedicated zone they already sit in.

## Files / Areas Touched

- `src/features/gallery/components/CardGallery.tsx`
- `src/pages/DeckDetailPage.tsx` (passing commander/partner down)

## Out of Scope

- Making the commander swappable/removable from the Gallery tab — that's handled via the existing commander-selection flow in the deck builder, not this task.
