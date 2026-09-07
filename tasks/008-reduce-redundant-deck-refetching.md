# 008 — Reduce redundant deck-list refetching across pages

**Labels:** `enhancement`, `area:data-layer`, `priority:low`
**Estimate:** S
**Depends on:** none

## Summary

There's no shared cache between pages, so `deckStore.getAll()` gets called independently — and refetched from Supabase from scratch — every time you land on `HomePage`, `WishlistPage`, or `DeckDetailPage`. For a personal app with a small number of decks this isn't a performance emergency, but it is unnecessary network chatter and a small amount of duplicated `useEffect` boilerplate.

## Background

- `src/pages/HomePage.tsx` — `deckStore.getAll()` on mount, for the deck grid.
- `src/pages/WishlistPage.tsx` — `deckStore.getAll()` on mount, just to populate the deck-tag filter/picker.
- `src/pages/DeckDetailPage.tsx` — `deckStore.getAll()` on mount (separate from its `deckStore.getById(deckId)` call for the active deck), to populate `allDecks` for the wishlist-tagging tab.

Each is a plain fetch-on-mount `useEffect`, not a shared hook.

## Acceptance Criteria

- [ ] A single shared hook (e.g. `useDecks()`) wraps `deckStore.getAll()` and is used by all three pages, instead of each page having its own copy of the same `useEffect`.
- [ ] Keep the fix proportionate: this does **not** need a caching/query library (React Query, SWR, etc.) — that would be more infrastructure than this app's scale justifies. A shared hook that still fetches on each mount (or a simple in-memory cache with a manual invalidation call after writes) is enough.
- [ ] Deck list still reflects newly created/deleted/renamed decks correctly on the pages that use it (verify after create, delete, and rename flows).

## Files / Areas Touched

- New hook, likely `src/hooks/useDecks.ts`
- `src/pages/HomePage.tsx`, `WishlistPage.tsx`, `DeckDetailPage.tsx`

## Out of Scope

- Introducing a query-caching library — explicitly not warranted here, see above.
- `DeckDetailPage`'s `deckStore.getById(deckId)` call for the *active* deck — that's a different, necessary fetch, not part of this dedup.
