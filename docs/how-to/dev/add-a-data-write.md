# Add a data write (mutation)

This guide shows how to add a new persisted change that follows the app's two write conventions.

## Goal

Add a write to Supabase, such as a new deck field, a new wishlist action, or a new objective edit. When you're done it persists, keeps the UI in sync when it fails, and passes lint and build. This guide assumes you have a working dev environment ([Development setup](../../contributing/development-setup.md)) and know how pages, feature hooks, and `src/store/*.ts` modules fit together ([Architecture overview](../../explanation/architecture.md)). For why the two conventions exist, read [Two write conventions, and why each exists](../../explanation/architecture.md#two-write-conventions-and-why-each-exists).

## Prerequisites

- `npm run dev` runs and you can sign in.
- You know which table the change touches: `decks`, `objectives`, or `wishlist_entries`. See [Data model](../../reference/data-model.md#tables).

## Steps

### 1. Decide which convention applies

| If the change… | Use |
| --- | --- |
| alters anything stored inside a `Deck` (name, commander, partner, `entries`, `objectives`/Strategy, `versions`, per-card `objectiveIds`) | **Whole-deck write**: steps 2–3 |
| inserts, updates, or deletes a single row in `wishlist_entries` or `objectives`, or deletes a whole deck | **Row-level write**: steps 4–5 |

A deck is saved as one row by `deckStore.save`, which upserts every column. Any change to deck contents is therefore a whole-deck write, even if it touches one card.

### 2. Whole-deck: write a pure helper that returns a new `Deck`

Add an exported function next to the existing helpers in `src/store/deckStore.ts` (`addCardToDeck`, `addStrategicObjective`, `removeStrategicObjective`, …). These are module-level exports, not methods on the `deckStore` object. The helper takes a `Deck`, returns a new `Deck`, sets `updatedAt`, and does no I/O:

```ts
export function renameDeck(deck: Deck, name: string): Deck {
  return { ...deck, name, updatedAt: new Date().toISOString() };
}
```

If the logic belongs to a feature hook instead (as with `useGallery` and `useDeckVersions`), keep the hook pure the same way: build the updated deck and pass it to the `onDeckChange` callback the page gives it. Don't import `deckStore` in the hook.

### 3. Whole-deck: route the result through the page's autosave

Hand the new deck to the page's existing commit function. Don't call `deckStore.save` yourself.

- **On `DeckDetailPage`**, call `commitDeck`. It sets local state and queues the save on `useDeckAutosave`:

  ```ts
  const handleRename = (name: string) => {
    commitDeck(renameDeck(activeDeck, name));
  };
  ```

  If your change lives in a hook, pass `commitDeck` to it as that hook's `onDeckChange`, the way `useGallery(safeDeck, commitDeck)` and `useDeckVersions(safeDeck, commitDeck)` do.

- **In the deck builder** (`useDeckBuilder`), call `commitCards(next)`. It updates `deckRef` and state, then calls the autosave `save` only when the deck has a name.

Never add a second, independent `deckStore.save` call on a page that already autosaves. Two full-deck upserts in flight at once can land out of order. The queue in `src/hooks/useDeckAutosave.ts` exists to prevent that.

You don't need any failure handling of your own. On failure, `useDeckAutosave` keeps the local deck, sets `status` to `"error"`, and `retry` re-saves the latest snapshot. Both pages already render that state. `DeckDetailPage` shows "Couldn't save your deck changes." with a **Retry** button. `DeckBuilderPage` shows "Couldn't save your last change." with **Retry**. Don't roll a whole-deck change back.

Skip to step 6.

### 4. Row-level: add a store function that throws on error

In `src/store/wishlistStore.ts` or `src/store/objectivesStore.ts`, add an `async` method that throws when Supabase returns `{ error }`. Follow the existing message format and pass the Supabase error as `cause`:

```ts
async updateNote(entryId: string, note: string): Promise<void> {
  const { error } = await supabase
    .from("wishlist_entries")
    .update({ note })
    .eq("id", entryId);

  if (error) throw new Error(`wishlistStore.updateNote: ${error.message}`, { cause: error });
},
```

- For an insert, get the user with `supabase.auth.getUser()` and throw if there's none (see `wishlistStore.add`). Return the domain object only after the insert succeeds.
- For a read-modify-write (for example `tagDeck` or `addObjective`), throw on the read's error too, not only the write's.
- Map rows to domain types inside the store (`rowToEntry` in `wishlistStore`). Hooks only see domain types.
- Leave read paths alone. `getAll` and `getForDeck` log and return `[]` instead of throwing.

### 5. Row-level: apply the change optimistically in the hook, then roll back on failure

Add a `useCallback` mutator to the feature hook (`src/hooks/useWishlist.ts`, `src/hooks/useObjectives.ts`). Copy the shape of the matching existing mutator:

- **Update or remove.** Take a snapshot, apply the change, await the store call, and restore the snapshot in `catch`. This is the `removeEntry` and `unassignObjective` shape. Add the state to the dependency array when the callback reads it for the snapshot.

  ```ts
  const updateNote = useCallback(
    async (entryId: string, note: string) => {
      const snapshot = entries;
      setEntries((prev) =>
        prev.map((e) => (e.id === entryId ? { ...e, note } : e)),
      );
      try {
        await wishlistStore.updateNote(entryId, note);
      } catch {
        setEntries(snapshot);
      }
    },
    [entries],
  );
  ```

- **Insert.** Add a temp item with a `crypto.randomUUID()` id. On success, swap it for the returned row. On failure, filter the temp item out and rethrow, so the caller can tell the user. This is the `addCard` and `addObjective` shape.

- **Small additive changes** (`tagDeck`, `assignObjective`). You can undo the specific change in `catch` instead of keeping a snapshot.

Return the new mutator from the hook. If the user needs to see the failure, add a message to whatever the calling component already has room for, such as `HomePage`'s inline `alert-error` for a failed deck delete. Don't build a global toast system for it.

### 6. Run lint and build

```bash
npm run lint
npm run build
```

Both must pass. The pre-commit hook also runs `eslint --max-warnings=0` and `tsc -p tsconfig.app.json --noEmit` on staged `.ts`/`.tsx` files. Fix warnings too, not just errors. See [Pre-commit gate](../../reference/configuration-and-commands.md#pre-commit-gate).

### 7. Force a failure and watch the UI

The happy path doesn't show whether rollback or Retry works. Make the write fail on purpose:

- **Option A:** temporarily add `throw new Error("test")` at the top of your new store function (or of `deckStore.save` for a whole-deck write).
- **Option B:** in browser DevTools, open the Network panel and set throttling to **Offline**, then trigger the write.

Then check:

- **Row-level:** the item appears, then reverts to its previous state.
- **Whole-deck:** your change stays on screen and the error message with **Retry** appears. Remove the forced failure (or go back online), click **Retry**, and reload the page. The change should still be there.

Remove any temporary `throw` before you commit.

## Final result

- The change persists across a page reload.
- On a forced failure, a row-level change rolls back, and a whole-deck change stays local with a working **Retry**.
- `npm run lint` and `npm run build` pass.
- `grep -rn "deckStore.save(" src` shows no new call. The existing calls are in `src/hooks/useDeckAutosave.ts` and in `src/components/ImportDeckButton/ImportDeckButton.tsx`. The import button saves an imported deck directly, before any autosaving page has it open.

## Next steps

- [Data model](../../reference/data-model.md): tables, domain types, and every existing store function.
- [Architecture overview](../../explanation/architecture.md): why whole-deck writes are queued and row-level writes are optimistic.
- [Conventions and workflow](../../contributing/conventions.md): code conventions, branching, and commits.
- [`tasks/001`](../../../tasks/001-fix-inconsistent-mutation-error-handling.md): the audit that set up these conventions.
