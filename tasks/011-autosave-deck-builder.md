# 011 — Auto-save the deck builder on card add

**Labels:** `enhancement`, `area:deck-builder`, `priority:medium`
**Estimate:** S
**Depends on:** [`001`](001-fix-inconsistent-mutation-error-handling.md) — autosave makes silent write failures worse (the user has no explicit "Save" click to notice a failure around), so land this after `deckStore.save` actually throws and a rollback/failure signal exists.

## Summary

`IDEAS.md` asks for the deck builder to auto-save when a card is added, instead of requiring an explicit save action. Today, `useDeckBuilder`'s `addCard` only mutates local state — persistence happens exclusively through a separate "Save Deck" button.

## Background

`src/features/deckBuilder/hooks/useDeckBuilder.ts`: `addCard` (line 77) calls `setDeck` only. The only path to `deckStore.save` is `saveDeck` (line 99), wired to an explicit `handleSave` on a "Save Deck" button in `src/pages/DeckBuilderPage.tsx:50-52,75-81`. There's no debounce or auto-persist on change today.

The pattern to follow already exists elsewhere in the codebase — `useGallery.ts` (`assignObjective`/`unassignObjective`) and `useDeckVersions.ts` mutations already auto-persist to `deckStore.save` on every change, optimistically. This task is about bringing the primary add-card path in line with that existing convention, not inventing a new one.

## Acceptance Criteria

- [ ] Adding a card in the deck builder triggers a `deckStore.save` without requiring the user to click "Save Deck" first.
- [ ] Saves are debounced or batched sensibly (e.g. don't fire a network request per keystroke if rapid card adds happen in succession) — a short debounce (e.g. 500ms–1s) after the last change is enough; this app's scale doesn't need anything more elaborate.
- [ ] Failure handling follows `001`'s established pattern: on a failed autosave, the local change rolls back (or the user gets a visible signal) rather than silently diverging from what's in Supabase.
- [ ] Decide what happens to the existing explicit "Save Deck" button — likely becomes redundant/removable, or repurposed as a manual "force sync" affordance. Confirm with the product owner which is wanted before removing it outright.
- [ ] New decks (not yet persisted, no `deckId`) still work correctly — clarify whether the first card add creates the deck row immediately or whether deck creation still needs an explicit first step.

## Files / Areas Touched

- `src/features/deckBuilder/hooks/useDeckBuilder.ts`
- `src/pages/DeckBuilderPage.tsx`

## Out of Scope

- Auto-saving other mutations already covered by their own patterns (objectives, wishlist, versions) — those already autosave or are covered by `001`.
- Offline/conflict resolution — out of scope for this app's scale.
