# 021 — Enforce the duplicate-card check on import and version-swap, not just add-card

**Labels:** `bug`, `area:deck-builder`, `priority:medium`, `needs-product-input` (only for the import-rejection-vs-dedup decision below — the version-swap fix is unambiguous and doesn't need sign-off)
**Estimate:** S
**Depends on:** none

## Summary

`IDEAS.md`: "In commander format, you cannot have two of the same (non-basic land) card - there is currently no check in place to prevent that from happening." This is only true for two of three ways a duplicate can enter a deck — `deckStore.duplicateCardInDeck()` already exists and is enforced on the primary add-card flow, but not on deck import or version-swap.

## Background

- **Add-card (already correct):** `src/features/deckBuilder/hooks/useDeckBuilder.ts:85` calls `duplicateCardInDeck` (`src/store/deckStore.ts:189-196`, which also checks against `deck.commander`/`deck.partner`, not just `entries`).
- **Import (unenforced):** `src/store/deckStore.ts:219-239` (`importDeckFromFile`) only runs `isValidDeck` (line 241), a structural field-presence check — it never calls `duplicateCardInDeck`. `src/components/ImportDeckButton/ImportDeckButton.tsx:26-76` calls `importDeckFromFile` → `deckStore.save` directly with no dedup pass. A hand-edited or malformed import JSON with duplicate entries saves as-is.
- **Version swap (different, weaker check):** `src/features/gallery/components/SwapSidebar.tsx:136-149` (`handleSelect`) uses `deckEntryIds.has(card.id)` — a `Set` built in `CardGallery.tsx:363` from only the *original* base `entries` prop. This differs from `duplicateCardInDeck` in two ways: (1) it doesn't check against `deck.commander`/`deck.partner`, so a commander could be re-added as a regular entry via swap; (2) it only checks the original entries, not cards already added by *other pending swaps in the same session*, so two different pending swaps could each add the same replacement card without being caught.

## Acceptance Criteria

- [ ] `importDeckFromFile` rejects (or de-duplicates, with a clear decision on which) an import containing duplicate non-basic-land card entries, or a card entry matching the commander/partner. Confirm with the product owner whether the right behavior is "reject the whole import with an error" or "silently drop duplicates" — don't guess.
- [ ] `SwapSidebar.handleSelect` uses `duplicateCardInDeck` (or an equivalent check with the same commander/partner coverage) instead of its own weaker `deckEntryIds.has(card.id)` set, AND accounts for cards already staged by other pending swaps in the same session, not just the original base entries.
- [ ] Basic lands remain correctly exempted from all three checks, matching `duplicateCardInDeck`'s existing behavior for the add-card path (verify what that behavior actually is — the function as read doesn't obviously special-case basic lands, so this may itself need a small fix; check before assuming it already works).
- [ ] Add a short regression note/manual test: import a deck JSON with an intentional duplicate, and attempt a version swap that would create a duplicate, confirming both are now caught.

## Files / Areas Touched

- `src/store/deckStore.ts` (`importDeckFromFile`, possibly `duplicateCardInDeck` itself for the basic-land check)
- `src/components/ImportDeckButton/ImportDeckButton.tsx` (or wherever the import UI surfaces an error to the user)
- `src/features/gallery/components/SwapSidebar.tsx`, `CardGallery.tsx`

## Out of Scope

- Any change to the add-card flow's existing, already-correct behavior.
