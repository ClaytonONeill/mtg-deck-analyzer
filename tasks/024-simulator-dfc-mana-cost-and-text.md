# 024 — Simulator treats double-faced cards as free / text-less

**Labels:** `bug`, `area:simulator`, `priority:low`
**Estimate:** XS
**Depends on:** none (follow-up to [`013`](013-double-faced-card-images.md))

## Summary

Found while landing `013`. For double-faced cards (Scryfall `layout` of `transform` / `modal_dfc`), Scryfall puts `mana_cost` and `oracle_text` on each entry of `card_faces`, **not** on the top-level card. `HandSimulator.tsx`'s `scryfallToSimCard` / `buildCardPool` read only the top-level fields and default them to `""`, so in the simulator:

- `parseManaCost("")` yields a zero cost — a DFC like Legion's Landing (`{W}`) can be cast for free.
- `oracle_text` is empty, so `manaUtils.extractManaAbilityClause` finds no mana ability — e.g. an MDFC whose back face is a land won't be treated as a mana source.

Priority is low per the product owner: the simulator isn't heavily used right now. Logged so it isn't lost.

## Acceptance Criteria

- [ ] When building `SimCard`s, fall back to `card_faces[0].mana_cost` / `card_faces[0].oracle_text` when the top-level field is absent (front face is what's cast from hand).
- [ ] Decide whether to model playing an MDFC's back face (e.g. as a land) — likely out of scope; the front-face fallback alone fixes the "free to cast" bug.
- [ ] Single-faced cards unaffected.

## Files / Areas Touched

- `src/features/simulator/components/HandSimulator.tsx` (`scryfallToSimCard`, `buildCardPool`)

## Out of Scope

- The same top-level-field gap elsewhere (e.g. `ManaCost` badges in `DeckEntryList`, `SwapSidebar`, `WishlistCard` rendering blank for DFCs) — cosmetic, not a rules bug; fold in only if it's trivially the same helper.
- Transform/flip as a simulator game action.
