# 014 — Compare decks against each other, not just versions of one deck

**Labels:** `feature`, `area:deck-versions`, `priority:low`, `needs-product-input`
**Estimate:** L
**Depends on:** none. Explicitly called out of scope in [`007`](007-deck-version-editing-gaps.md) — that task owns finishing version editing, this one owns the separate cross-deck comparison ask.

## Summary

`IDEAS.md` suggests comparing entire decks against each other (not just versions of the same deck) to spot strategy differences. `src/features/deckVersions/components/VersionCompare.tsx` already has real, reusable comparison infrastructure that a cross-deck comparison could build on rather than starting from scratch.

## Background

`VersionCompare.tsx` (rendered from `DeckDetailPage.tsx:421` when `metricView === "compare"`) has:

- Side-by-side selectors (`leftId`/`rightId`, lines 33-36)
- A diff engine (`getCardDiff`, lines 61-74) comparing entries by `card.id`
- A shared `Types`/`CMC` chart layout via `ChartSelectionProvider` (lines 246-267)

But `resolveDeck` (lines 42-46) only resolves `"main"` or a `deck.versions[]` entry of the *current* deck — it has no notion of a second, entirely different `Deck`. Extending to cross-deck compare means `resolveDeck`/its options need to accept a full second `Deck` object (fetched via `deckStore.getById`), not just a version-id string scoped to one deck.

## Acceptance Criteria

- [ ] **Confirm scope with the product owner before building anything** — decide where this lives in the UI (a new top-level page? an option from `HomePage`'s deck grid, e.g. "select two decks to compare"?) and whether it should reuse `DeckDetailPage`'s existing compare tab or be a separate page.
- [ ] Reuse `VersionCompare`'s diff (`getCardDiff`) and chart-rendering logic rather than re-implementing it — refactor `resolveDeck`/the selector inputs to accept an arbitrary second `Deck`, keeping the existing version-vs-version behavior working unchanged.
- [ ] Cross-deck compare correctly handles decks with completely disjoint commanders/color identities (the existing version-compare UI never has to handle that, since versions share a commander) — verify no assumptions leak in from the single-commander case.
- [ ] Loading a second deck for comparison doesn't add another redundant `deckStore.getAll()`/`getById` call pattern — coordinate with [`008`](008-reduce-redundant-deck-refetching.md) if that's landed by the time this starts.

## Files / Areas Touched

- `src/features/deckVersions/components/VersionCompare.tsx` (or a new sibling component built on its diff logic)
- Possibly a new page/route for deck-vs-deck selection
- `src/pages/HomePage.tsx` (if the entry point is deck-grid selection)

## Out of Scope

- Any changes to version-vs-version comparison behavior — must remain unchanged.
- Comparing more than two decks at once.
