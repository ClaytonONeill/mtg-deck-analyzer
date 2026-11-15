# 001 — Fix inconsistent / silently-broken error handling in mutations

**Labels:** `bug`, `area:data-layer`, `priority:high`
**Estimate:** M
**Depends on:** none

## Summary

Most write paths in this app either drop Supabase errors on the floor or wire up rollback logic that can never actually fire, because the store layer doesn't reject/throw when Supabase reports an error. A failed save currently looks identical to a successful one from the UI's perspective.

## Background

`src/store/deckStore.ts`'s `save()`:

```ts
const { error } = await supabase.from('decks').upsert(...);
if (error) {
  console.error('deckStore.save error:', error);
} else {
  console.log('deckStore.save success:', deck.name);
}
```

It never throws. Two hooks already contain what looks like correct optimistic-rollback logic built around this:

- `src/features/gallery/hooks/useGallery.ts` (`assignObjective`/`unassignObjective`): `void deckStore.save(updated).catch(() => onDeckChange(safeDeck))`
- `src/features/deckVersions/hooks/useDeckVersions.ts`'s `appendToVersion`: same pattern

**Both of these `.catch()` blocks are dead code** — `deckStore.save` never rejects on a Supabase-reported error (`{ error }` in the response), so the rollback can only ever run on a hard network exception, not a normal API error (permission denied, constraint violation, etc.).

The other methods in `useDeckVersions.ts` (`saveAsVersion`, `deleteVersion`, `updateVersion`, `assignObjectiveToVersion`, `unassignObjectiveFromVersion`) don't even attempt a `.catch()` — they call `deckStore.save(updated)` fire-and-forget after already having called `onDeckChange(updated)`.

`src/pages/HomePage.tsx`'s `handleDelete` has the same shape, but worse — it calls `deckStore.delete(id)` without `await`/`.catch()` even though `deckStore.delete` **does** throw on failure (see below), so a failed delete throws an unhandled promise rejection while the deck has already been removed from the UI.

`src/store/wishlistStore.ts` has the same silent-swallow issue in `add`, `remove`, `tagDeck`, `untagDeck`, `updateNote`, `updateObjective`, `addObjective`, `removeObjective` — none of them throw on a Supabase error. Notably `add()` still returns a synthesized "success" entry even when the `insert` failed.

`src/store/objectivesStore.ts` is internally inconsistent: `addObjective`/`updateObjective` do `throw error` on failure, but `deleteObjective` only `console.error`s.

The hooks that get this right today — `src/hooks/useWishlist.ts` and `src/hooks/useObjectives.ts` — apply a temp value, call the store method, and roll back in a `catch`. They only work correctly for the store methods that actually throw (auth-guard throws like `"no authenticated user"`), not for a normal Supabase-reported error, because of the store-layer issue above.

## Acceptance Criteria

- [x] Every mutating method in `deckStore`, `wishlistStore`, `objectivesStore` throws (or rejects) when Supabase returns `{ error }`, instead of only logging.
- [x] `wishlistStore.add` does not return a synthesized success value when the underlying insert failed.
- [x] Every hook/page that mutates data (`useWishlist`, `useObjectives`, `useGallery`, `useDeckVersions`, `HomePage.handleDelete`) follows the same optimistic-update pattern: apply local change → await the store call → on failure, roll back the local change and surface *something* to the user (at minimum, don't leave the UI silently out of sync with the database).
- [x] No mutation is fire-and-forget without a `.catch()` that actually does something.
- [ ] Manually verify at least one rollback path by forcing a failure (e.g. temporarily throw inside a store method, or disconnect network) and confirming the UI reverts.

## Subtasks

- [x] Audit and fix `deckStore.save`, `deckStore.delete` (done with the suggestions quick-add work: `save` now throws on `{ error }` and on a missing user. Deck-builder card edits, Suggestions quick add, and the detail page's strategy objectives save through `src/hooks/useDeckAutosave.ts`, a serialized queue that keeps local changes and shows Retry on failure. `useGallery`'s and `appendToVersion`'s rollbacks now fire. `useDeckVersions`' uncaught saves now surface as unhandled rejections; the hook items below are still open.) (already throws — keep), `deckStore` is otherwise fine to leave `getAll`/`getById` as-is (read paths already degrade to `[]`/`undefined`, which is an acceptable, separate convention — don't change read-path error handling as part of this task).
- [x] Audit and fix all mutating methods in `wishlistStore.ts` to throw on `{ error }`.
- [x] Fix `objectivesStore.deleteObjective` to throw like its siblings do.
- [x] Fix `useDeckVersions.ts`: `saveAsVersion`, `deleteVersion`, `updateVersion`, `assignObjectiveToVersion`, `unassignObjectiveFromVersion` — add await + rollback matching `appendToVersion`'s existing shape (which will now actually work once `deckStore.save` throws correctly).
- [x] Fix `HomePage.tsx`'s `handleDelete` to await `deckStore.delete`, roll back the optimistic removal on failure, and not crash on an unhandled rejection.
- [x] Decide on and apply a minimal user-facing failure signal (a daisyUI `alert`/toast, even a simple inline message) for at least the delete/save paths — don't build a global toast system for this; scope it to what each affected component already has room for.

## Files / Areas Touched

- `src/store/deckStore.ts`
- `src/store/wishlistStore.ts`
- `src/store/objectivesStore.ts`
- `src/features/deckVersions/hooks/useDeckVersions.ts`
- `src/pages/HomePage.tsx`

## Out of Scope

- Building a global toast/notification system.
- Changing the read-path (`getAll`/`getById`) error convention.
- `useGallery.ts` and `useWishlist.ts`/`useObjectives.ts` optimistic-update *shape* — they're already correct, they just need the store layer under them fixed.

## Notes

This is the highest-value fix in the backlog: several places in the codebase already have the right rollback code written, it's just currently unreachable because of the store layer swallowing errors.

## Status (2026-11-15)

Code-complete; only the manual forced-failure check is open.

- **Stores:** every `wishlistStore` mutation and `objectivesStore.deleteObjective` now throw `Error` (with the Supabase error as `cause`) instead of logging. Read-modify-write methods also throw on the read half's error. Read paths unchanged.
- **Deck detail page — deviated from the subtask as written, deliberately.** Rather than give `useDeckVersions`/`useGallery` their own await + rollback, both hooks are now pure (no `deckStore` import) and hand the updated deck to the page's `commitDeck`, which does `setDeck` + `useDeckAutosave().save`. Reason: the page already had three independent whole-deck writers (gallery tagging, versions, autosave queue). Unordered full-deck upserts can land out of order, and snapshot rollbacks could revert a *different* path's change. One queue fixes both; failures show the page's existing Retry toast and keep local state (see `useDeckAutosave`'s doc comment for why it doesn't roll back).
- **HomePage delete:** awaits, restores the tile on failure, shows a dismissible inline alert.
- **To verify manually:** temporarily make `deckStore.save` / `deckStore.delete` / `wishlistStore.remove` `throw new Error("test")` first thing, then (a) tag a card on the deck detail page → Retry toast appears; (b) delete a deck on Home → tile returns with an alert; (c) remove a wishlist entry → it reappears.
