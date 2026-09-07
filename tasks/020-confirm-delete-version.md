# 020 — Extend the confirm-delete modal to deck-version deletion

**Labels:** `bug`, `area:deck-versions`, `priority:medium`
**Estimate:** XS
**Depends on:** none

## Summary

`IDEAS.md` asks for a confirm-delete modal "for decks and deck versions" because it's too easy to delete something by accident. This is already half-done: `HomePage`'s deck deletion goes through a shared `ConfirmDelete` component. Deck-**version** deletion in `DeckDetailPage` has no confirmation at all — not even a plain `window.confirm`.

## Background

`src/components/ConfirmDelete/ConfirmDelete.tsx` already exists as a shared component and is wired into `HomePage.tsx` (`pendingDelete` state → `handleDeleteConfirm` → `deckStore.delete`).

`src/pages/DeckDetailPage.tsx:319-327` — the "Delete Version" button calls `deleteVersion(activeVersionId)` directly from its `onClick`, with zero confirmation step:

```tsx
<button
  onClick={() => {
    deleteVersion(activeVersionId);
    setActiveVersionId("main");
  }}
  className="btn btn-ghost btn-xs text-error hover:bg-error/10"
>
  Delete Version
</button>
```

## Acceptance Criteria

- [ ] Deleting a deck version routes through the same shared `ConfirmDelete` component `HomePage` already uses, rather than a new one-off implementation.
- [ ] Confirm copy clearly identifies what's being deleted (the version's name, not a generic "are you sure").
- [ ] `setActiveVersionId("main")` still happens after a confirmed delete, so the UI doesn't end up pointing at a deleted version.
- [ ] `deleteVersion` itself is still fire-and-forget per `001`'s findings — if `001` hasn't landed yet, at minimum don't make this task's UI imply a guarantee ("Deleted!") that the underlying call doesn't back up; if `001` has landed, use its established await/rollback pattern here too.

## Files / Areas Touched

- `src/pages/DeckDetailPage.tsx`

## Out of Scope

- `ConfirmDelete` component's own implementation — reuse as-is unless it's missing something this use case genuinely needs (e.g. if it's hardcoded to deck-shaped copy, that's a small prop addition, not a rewrite).
