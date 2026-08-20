# 017 — Fix "New Deck" not resetting builder state from Edit Deck view

**Labels:** `bug`, `area:deck-builder`, `priority:medium`
**Estimate:** S
**Depends on:** none

## Summary

`IDEAS.md`: clicking "New Deck" while editing an existing deck doesn't clear the loaded deck's cards — it just renders the import button on top of stale state. Root cause is identified below.

## Background

- `src/components/Header/Header.tsx:64-70,109-115` — the "+ New Deck" button calls `navTo("/build")` unconditionally, including while already on `/build/:deckId`.
- `src/App.tsx:42-43` — both `/build` and `/build/:deckId` render the same `<DeckBuilderPage />`, so React Router may reuse the existing component instance instead of remounting it.
- `src/features/deckBuilder/hooks/useDeckBuilder.ts:33-46` — the deck-loading `useEffect` only handles the `deckId` **present** case (`if (!deckId) return`); it never resets `deck` back to `createNewDeck('')` when `deckId` transitions from defined to `undefined` on the same mounted instance.
- Meanwhile `DeckBuilderPage.tsx:70` switches to rendering `<ImportDeckButton>` once `!deckId` is true, so the user sees the "new deck" import affordance layered over the previous deck's still-present card state — matching the reported bug exactly.

## Acceptance Criteria

- [ ] Navigating to "New Deck" from an active Edit Deck view fully clears the previously loaded deck's commander, partner, and entries before the import button becomes usable.
- [ ] Fix at the state layer (`useDeckBuilder`'s effect explicitly resetting to `createNewDeck('')` when `deckId` becomes undefined) rather than papering over it by forcing a full remount — a remount-based fix (e.g. a `key` prop keyed on `deckId`) is an acceptable alternative if simpler, but confirm it doesn't reintroduce a flash-of-stale-content on the transition.
- [ ] Verify the reverse transition too (editing deck A, then navigating directly to edit deck B via a different route) doesn't leak deck A's state either — same root cause, same fix should cover it.

## Files / Areas Touched

- `src/features/deckBuilder/hooks/useDeckBuilder.ts`
- `src/pages/DeckBuilderPage.tsx`
- `src/components/Header/Header.tsx` (only if the fix ends up needing a navigation-side change instead of/in addition to the hook fix)

## Out of Scope

- Removing the "New Deck" option entirely (`IDEAS.md` offers this as an alternative) — fix the underlying bug instead unless the product owner explicitly prefers removal.
