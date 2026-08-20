# 016 — Show commander/partner cards in Gallery view

**Labels:** `enhancement`, `area:gallery`, `priority:low`
**Estimate:** XS
**Depends on:** none

## Summary

`IDEAS.md`: "Right now you can only see the cards within the deck but cannot see your own commander card [in Gallery view]." Confirmed accurate — the Gallery grid only renders the deck's 99 non-commander entries.

## Background

`src/features/gallery/components/CardGallery.tsx` — the `entries` prop (sourced from `DeckDetailPage.tsx:434-437`'s `displayDeck.entries`) never includes `Deck.commander`/`Deck.partner`, and the grid rendering (lines 216-330) has no separate slot for them either. Commander/partner *are* visible elsewhere in the app (the deck-identity header in `DeckDetailPage.tsx:266-274`, the sidebar badge in `DeckBuilderPage.tsx:271-288`) — just not inside the Gallery tab itself.

## Acceptance Criteria

- [ ] Commander (and partner, if set) render in the Gallery grid — as a pinned/leading tile, or a visually distinct small section above the 99, so it stays clear it's not swappable/removable the way regular entries are.
- [ ] Commander/partner tiles are visually distinguishable from regular entries (e.g. a badge or border), consistent with how they're marked elsewhere in the app.
- [ ] Clicking the commander tile behaves sensibly given whatever click affordances (objective tagging, swap, zoom) the rest of the grid has — decide whether commander/partner should support those same actions or be display-only, and keep that decision consistent with existing surfaces (e.g. `SwapSidebar` shouldn't let you "swap out" your commander).
- [ ] No change to `displayDeck.entries`'s actual contents/count — this is a display-only addition, not a change to what counts as a deck's 99 cards.

## Files / Areas Touched

- `src/features/gallery/components/CardGallery.tsx`
- `src/pages/DeckDetailPage.tsx` (passing commander/partner down)

## Out of Scope

- Making the commander swappable/removable from the Gallery tab — that's handled via the existing commander-selection flow in the deck builder, not this task.
