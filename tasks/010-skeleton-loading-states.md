# 010 — Replace spinner+text loading states with skeleton placeholders

**Labels:** `enhancement`, `area:styling`, `priority:low`
**Estimate:** S
**Depends on:** none, but coordinate with [`003`](003-shared-page-shell-component.md) — that task explicitly excludes skeleton loading from its shared page-shell/spinner component, so land this either alongside or after it to avoid rebuilding the same loading slot twice.

## Summary

`IDEAS.md` asks for skeleton loading instead of "a simple text line." Every loading state in the app today is a daisyUI `loading-spinner`/`loading-ring` plus one line of copy (e.g. "Scanning the multiverse...") — there are no skeleton placeholders anywhere.

## Background

Confirmed spinner+text loading states in: `src/pages/HomePage.tsx:36-44`, `src/pages/DeckDetailPage.tsx:158-167`, `src/pages/DeckBuilderPage.tsx:54-63`, `src/pages/WishlistPage.tsx:181-189`, and an inline button spinner in `src/pages/LoginPage.tsx`. `src/pages/ObjetivesPage.tsx` has no loading gate at all — it renders an empty state until `useObjectives` resolves, which is its own small gap worth fixing here too.

`tasks/003` is about extracting one shared page-shell component (background token + loading slot) — it deliberately does not scope *what* renders inside that loading slot. This task is about that content: skeleton placeholders shaped like the content that's about to appear (card grid tiles for `HomePage`/`WishlistPage`, a deck-detail layout skeleton for `DeckDetailPage`, etc.) instead of a generic spinner.

## Acceptance Criteria

- [ ] Define a small set of reusable skeleton primitives (e.g. a skeleton card tile, a skeleton text line) using daisyUI's `skeleton` utility class, tokenized so they respect the active theme.
- [ ] Replace the loading states in `HomePage`, `DeckDetailPage`, `DeckBuilderPage`, and `WishlistPage` with skeleton layouts that roughly match their eventual content shape (a grid of skeleton deck/card tiles is enough — don't hand-tune pixel-perfect skeletons).
- [ ] Add a loading gate to `ObjetivesPage.tsx`, which currently has none.
- [ ] If `003` has already landed a shared page-shell component by the time this starts, wire skeletons into its loading slot instead of duplicating shell markup.

## Files / Areas Touched

- `src/pages/HomePage.tsx`, `DeckDetailPage.tsx`, `DeckBuilderPage.tsx`, `WishlistPage.tsx`, `ObjetivesPage.tsx`
- Possibly a new shared skeleton component under `src/components/`

## Out of Scope

- Skeletons for every nested loading state (e.g. individual card images finishing loading) — this task covers the page-level "data not fetched yet" states listed above only.
- The shared page-shell extraction itself — that's `003`.
