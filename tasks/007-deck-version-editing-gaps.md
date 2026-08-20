# 007 — Finish deck-version editing (rename/note, per-swap removal)

**Labels:** `bug`, `feature`, `area:deck-versions`, `priority:medium`, `needs-product-input`
**Estimate:** M
**Depends on:** none (should land after #001, since it touches the same hook and benefits from correct error handling being in place first)

## Summary

`IDEAS.md` flags "you can't modify a version without creating a new one" as a pain point. That's only half true today: appending new swaps to an existing version already works end-to-end. What's actually missing is renaming/editing a version's note after creation, and removing or editing an individual swap once it's part of a version. The hook function for the former (`updateVersion`) already exists but is never called from any UI.

## Background

`src/features/deckVersions/components/SaveVersionModal.tsx` already has an "Update Existing" vs "Save as New" toggle, wired in `src/pages/DeckDetailPage.tsx`'s `handleUpdateVersion` to `useDeckVersions`'s `appendToVersion` — so the core "add more swaps to an existing version" flow the product owner asked about is implemented.

What's missing:

- `useDeckVersions.ts` exports `updateVersion(versionId, name, note)`, which renames a version and edits its note — but nothing in the UI calls it. There's no way to rename a version or edit its note after `saveAsVersion` creates it.
- There's no way to remove or undo an individual swap that's already part of a saved version (only pending, not-yet-saved swaps can be undone, via `CardGallery`'s swap sidebar before hitting "Save as Version").
- `VersionCompare.tsx` (deck-version comparison UI) hasn't been checked for whether it exposes any editing affordance — verify it doesn't before assuming this gap is accurate.

## Acceptance Criteria

- [ ] **Confirm scope with the product owner before building anything** — this task has both an engineering half (wire up existing `updateVersion`) and a product half (decide what "remove a swap from a saved version" should even look like/feel like). Get sign-off on the UX before writing UI code.
- [ ] Once scoped: a saved version's name/note can be edited from `DeckDetailPage` (e.g. an edit affordance near the version selector/badge).
- [ ] Once scoped: a user can remove an individual swap from an already-saved version.
- [ ] Both new mutation paths follow the error-handling/rollback pattern established in #001 (don't fire-and-forget).
- [ ] `VersionCompare.tsx` still renders correctly for versions edited via these new paths.

## Files / Areas Touched

- `src/features/deckVersions/hooks/useDeckVersions.ts` (already has `updateVersion` — needs a new "remove swap" mutator)
- `src/features/deckVersions/components/SaveVersionModal.tsx`, `VersionCard.tsx`, `VersionBuilder.tsx`, `VersionCompare.tsx`
- `src/pages/DeckDetailPage.tsx`

## Out of Scope

- Redesigning the version-compare UI.
- The "compare decks, not just deck versions" idea from `IDEAS.md` — that's a separate, larger feature, not part of this task.

## Notes

Update `IDEAS.md`'s entry for this once scoped/done, since it currently describes the problem less precisely than this task does.
