# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this app is

MTG Deck Analyzer is a personal Commander/EDH deck-building tool for a handful of users (not a public product). It fronts two external services:

- **Supabase** (Postgres + Auth) — the only backend; the browser talks to it directly via `@supabase/supabase-js`. There is no custom server/API layer.
- **Scryfall's public REST API** (`api.scryfall.com`) — card data/search/images, called directly from the browser, unauthenticated.

Core things a user can do: build a Commander deck (search for a commander + up to 99 other cards, respecting color-identity legality and partner-commander rules), save multiple named **versions** of a deck as sets of card swaps and compare them, tag cards with user-defined **objectives** (freeform strategic tags), maintain a cross-deck **wishlist**, view deck composition charts (card types, mana curve), and run a hand-simulator.

`IDEAS.md` at the repo root is the product owner's running backlog/notes — check it for context on what's intentionally unfinished vs. what's a bug. Note it can go stale in both directions: a request can already be partially built (IDEAS.md still asks for a "Confirm Delete Modal"; a shared `ConfirmDelete` component already exists and is wired into `HomePage`'s deck-deletion flow, but not into `DeckDetailPage`'s deck-**version** deletion, so the idea is half-done, not untouched), or a fix can exist without the backlog item being removed (`deckStore.duplicateCardInDeck()` is already enforced in `useDeckBuilder`'s add-card path, which may substantially close "BUG: Duplicate Cards can be Added to the Deck" — unverified for the version-swap path). Don't trust an IDEAS.md line at face value; grep for the feature before assuming it's unbuilt.

**`/tasks/` already contains a granular, up-to-date engineering audit.** `001`–`009` cover architecture-level findings (error handling, theming, page-shell/header/icon drift, dead code, deck-version editing gaps, redundant refetching, a testing foundation) from the same pass that produced this file; `010`–`022` were added later, one per `IDEAS.md` backlog item that had no task file yet — each notes where the codebase already diverges from that IDEAS.md entry's description. Check `tasks/README.md`'s index before re-diagnosing an issue this file describes only at a summary level, or before assuming an IDEAS.md item is unscoped. Keep task checkboxes and the index current as work lands, since multiple agents may pick these up independently.

**Database is off-limits by default.** Do not read from or write to the live Supabase project (tables, RLS policies, storage, auth users) unless the current task explicitly scopes that work. Treat `.env.local` / Supabase credentials as sensitive — don't print or log their values.

## Commands

```bash
npm run dev       # start Vite dev server
npm run build     # tsc -b (project references, type-check only) then vite build
npm run lint      # eslint . (flat config, eslint.config.js)
npm run preview   # preview a production build
```

There is no test runner configured (no vitest/jest in `package.json`) — don't assume `npm test` exists. Standing up one is scoped as [`tasks/009`](tasks/009-testing-foundation-unit-and-acceptance.md) (multi-phase); don't add ad hoc test tooling outside that plan.

A husky `pre-commit` hook runs `npx lint-staged`, which on staged `.ts`/`.tsx` files runs `eslint --max-warnings=0` and `tsc -p tsconfig.app.json --noEmit`. Both must pass to commit.

Path alias: `@/*` → `src/*` (configured in both `vite.config.ts` and `tsconfig.app.json`).

## Architecture

### Auth and app shell

`main.tsx` wraps everything in `AuthProvider` (`src/context/AuthContext.tsx`), which owns the Supabase session via `supabase.auth.getSession()` + `onAuthStateChange`. `App.tsx` is a single global gate: while `loading` it shows a spinner, if there's no `user` it renders `LoginPage` full-stop, otherwise it mounts `ThemeProvider` + `BrowserRouter` + the global `Header` + `Routes`. There is no per-route auth logic — auth is all-or-nothing at the top of the tree, and there are only 6 flat routes (no nesting, no lazy-loading).

### Data layer: `src/store/*.ts`

Despite the name, these are **not** client-state stores (no Redux/Zustand/Jotai anywhere in the app) — they're thin data-access modules: plain objects of `async` functions that map directly to Supabase table CRUD (`deckStore`, `wishlistStore`, `objectivesStore`), each with its own hand-written row↔domain-type mapping. `deckStore.ts` additionally carries pure domain-logic helpers (`addCardToDeck`, `setCommander`, `isCardLegalForDeck`, deck import/export) — treat that file as two things stapled together: Supabase I/O and deck business rules.

### State management: per-feature hooks, no global store

Each feature has a hook in `hooks/` or `features/<name>/hooks/` that owns a slice of `useState`, fetches via a `store` in `useEffect` on mount, and exposes mutator callbacks (`useWishlist`, `useObjectives`, `useDeckBuilder`, `useDeckVersions`, `useGallery`, `useCardSearch`). Pages compose several of these directly as props-drilling sources — `DeckDetailPage` alone wires up five (`useObjectives`, `useGallery`, `useDeckVersions`, `useWishlist`, `useChartSelection`). There's no shared cache/query layer, so navigating between pages re-fetches from Supabase every time (e.g. `deckStore.getAll()` is called independently in `HomePage`, `WishlistPage`, and `DeckDetailPage`).

**Optimistic updates are inconsistent — know this before adding a new mutation.** `useWishlist` and `useObjectives` do it properly: apply a temp/local change, reconcile with the server response on success, revert on failure. Other places update local state and fire off `deckStore.save(...)` without awaiting or catching it (`useDeckVersions.saveAsVersion/deleteVersion/updateVersion`), so a failed save is silently dropped — the UI stays "successful" while Supabase never got the write. A couple of spots (`useDeckVersions.appendToVersion`, `useGallery`) do await + `.catch()` and roll back. `HomePage` now confirms deck deletion through a shared `ConfirmDelete` modal before calling `deckStore.delete(id)`, but still doesn't await or catch that call, even though the function throws on failure. On top of that, `deckStore.save` itself swallows its own errors (`console.error`, no throw), which quietly defeats any caller that *does* try to catch it. When touching any of these, match the pattern already used by `useWishlist`/`useObjectives` (temp value → reconcile → rollback) rather than either of the fire-and-forget variants — this exact fix is already scoped as [`tasks/001`](tasks/001-fix-inconsistent-mutation-error-handling.md).

### Scryfall integration

Called from two independent places with no shared client: `features/deckBuilder/hooks/useCardSearch.ts` (debounced search with `AbortController` + a request-id guard against out-of-order responses — this is the one place with real race-condition handling) and `utils/utils.ts`'s `configureBasicLandEndpoint` (basic land image URLs). No caching, no shared fetch wrapper, no rate-limit handling.

## Styling

Tailwind v4 (via `@tailwindcss/vite`) + daisyUI v5, driven by semantic tokens (`base-100/200/300`, `base-content`, `primary`, `error`, etc.) rather than raw Tailwind palette classes almost everywhere. `ThemeContext` (`src/context/ThemeContext.tsx`) stores the active daisyUI theme name in `localStorage` and sets `data-theme` on `<html>`; the theme `<select>` in `Header.tsx` hardcodes the list of ~16 daisyUI theme names inline.

Cohesion has drifted in a few concrete, fixable spots — worth knowing about before assuming the whole app is uniformly themed:

- **Two surfaces don't respect the theme at all**: the top-level loading screen in `App.tsx` and `ErrorBoundary`'s fallback UI use hardcoded Tailwind slate/blue classes (`bg-slate-950`, `text-slate-400`, `bg-[#1971c2]`) instead of daisyUI tokens. Switching themes doesn't change them, unlike every other screen.
- **No shared page-shell component**: each page (`HomePage`, `DeckBuilderPage`, `DeckDetailPage`, `WishlistPage`, `ObjectivesPage`) reimplements its own `min-h-screen` wrapper, background token (`bg-base-100` vs `bg-base-200` vs `bg-base-300` — not a deliberate distinction, just drift), and loading state (mixes `loading-spinner` and `loading-ring` daisyUI variants with slightly different copy/markup each time).
- **Duplicate chrome**: the global `Header` (mounted once in `App.tsx`, above `<Routes>`) already provides top-level nav, but `DeckBuilderPage`, `WishlistPage`, and `DeckDetailPage` each additionally render their own in-page sticky header bar with their own independent "Back" button implementation.
- **No single icon convention**: `lucide-react` is a dependency and is used in some places (`DeckDetailPage`), but other places hand-roll the equivalent icon as an inline `<svg>` (`DeckBuilderPage`'s back chevron, the warning-triangle alerts) instead of using the matching lucide icon.

If asked to improve stylistic cohesion, the lowest-effort fix is: migrate `App.tsx`'s loading screen and `ErrorBoundary` to daisyUI tokens, standardize on one page background token, extract a shared page-shell + spinner component, and settle on lucide-react as the single icon source — not a rewrite into styled-components or a new design-token system, which would be over-engineering for an app this size. These four items are individually scoped as [`tasks/002`](tasks/002-theme-aware-shell-screens.md)–[`005`](tasks/005-unify-icon-system.md) — pick one up rather than re-scoping from scratch.

Separately, `IDEAS.md` notes the objectives-tagging UI ("Objectives Menu Should be a Standardized Shared Component") exists as two or three divergent implementations rather than one shared component. Check for this before adding yet another objectives-tagging surface — a fourth one-off implementation would make the eventual consolidation harder, not easier.

**Breakpoints, minimum type sizes, and the z-index scale are defined in [`docs/design-tokens.md`](docs/design-tokens.md)** — read it before touching layout, typography, or anything `fixed`/`sticky`/`absolute`. It also documents known current violations (e.g. arbitrary sub-12px text, ad hoc z-index values, a likely-live bug where custom z-index utilities fight daisyUI's built-in `dropdown-content` stacking).

## Scale-appropriate scope

This is a small app for a handful of users — weigh new abstractions against that. A few things already lean past what the app needs or haven't paid for their complexity yet:

- The deck-**versions** subsystem (separate hooks/utils/compare UI, per-version objective overrides, swap tracking) is the most elaborate part of the codebase. `IDEAS.md` flags "can't edit a saved version without creating a new one" as clunky, but that's only half true today: appending new swaps to an existing version already works end-to-end (`SaveVersionModal`'s "Update Existing" path → `useDeckVersions.appendToVersion`). What's actually still missing — renaming/editing a version's note (the hook function `updateVersion` already exists but nothing in the UI calls it) and removing an individual swap from an already-saved version — is scoped precisely in [`tasks/007`](tasks/007-deck-version-editing-gaps.md), including a note to get product-owner sign-off before building. Don't add more machinery here without checking that task first.
- `hooks/useLocalStorage.ts` exists but has no callers anywhere in the app — dead code, tracked for removal in [`tasks/006`](tasks/006-housekeeping-dead-code-and-stale-docs.md) along with a couple of other one-file cleanups (e.g. `src/pages/ObjetivesPage.tsx`'s missing "c").
- Conversely, don't over-index on the request-id/`AbortController` race-guarding in `useCardSearch` as "the house style" — it's the only fetch in the app with that rigor; `HomePage`/`WishlistPage`/`DeckDetailPage` all do plain fetch-on-mount with a `mounted` boolean flag instead (redundantly — all three independently re-fetch `deckStore.getAll()`, which [`tasks/008`](tasks/008-reduce-redundant-deck-refetching.md) proposes consolidating into one shared hook). That's fine for their use case (single fetch, not a fast-typing search box) — don't port the heavier `useCardSearch` pattern in unless a spot actually has the same race condition.

## Where to put planning/working docs

- `/tasks/` — granular, GitHub-issue-style write-ups of well-scoped engineering work (one file per issue, see `tasks/README.md` for the index/template). Pick one of these up when asked to work on a specific, boundaried piece of the codebase.
- `docs/plans/` — freeform multi-step implementation plans or audit notes that don't fit the issue format above (create it if it doesn't exist).

Keep `IDEAS.md` as the product owner's single backlog of feature/bug notes — don't let engineering scratch work leak into it.
