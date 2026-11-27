# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository. It holds the **rules**; the narrative docs live under [`docs/`](docs/README.md) (Diátaxis layout: tutorials, how-to, reference, explanation). When this file and the code disagree, the code wins, so fix this file.

## What this app is

MTG Deck Analyzer is a personal Commander/EDH deck-building tool for a handful of users (not a public product). It is a browser-only SPA with no server of its own. It talks directly to:

- **Supabase** (Postgres + Auth), the only backend, via `@supabase/supabase-js`.
- **Scryfall's public REST API** (`api.scryfall.com`) for card data, search, images and prices. It's unauthenticated.
- **EDHREC's static JSON** (`json.edhrec.com`) for card suggestions. It's unofficial and undocumented, and isolated in `features/recommendations/utils/edhrecClient.ts`.

Users can build a Commander deck (commander + partner + up to 99 cards, color-identity legal, singleton), save named **versions** as card-swap diffs and compare them, tag cards with **objectives**, keep a cross-deck **wishlist**, view metrics charts, get suggestions, and run a hand simulator. Feature walkthroughs are in [`docs/README.md`](docs/README.md).

`IDEAS.md` at the repo root is the product owner's running backlog. It goes stale in both directions: items can already be partly or fully built. For example, "Confirm Delete Modal" is done: the shared `ConfirmDelete` covers deck deletion on `HomePage` and version delete/promote on `DeckDetailPage`. Some fixes also exist without the backlog line being removed, such as `duplicateCardInDeck()`, which is enforced on builder add. Don't trust an IDEAS.md line at face value; grep for the feature before assuming it's unbuilt.

**`/tasks/` is a granular engineering audit.** `001`–`009` are architecture-level findings, `010`–`022` map IDEAS.md items, and `023`+ are later design issues. Check `tasks/README.md`'s index before re-diagnosing an issue or assuming an IDEAS.md item is unscoped. Keep task checkboxes and the index current as work lands, since multiple agents may pick these up independently.

**Database is off-limits by default.** Do not read from or write to the live Supabase project (tables, RLS policies, storage, auth users) unless the current task explicitly scopes that work. Treat `.env.local` / Supabase credentials as sensitive, and don't print or log their values.

## Commands

```bash
npm run dev       # start Vite dev server
npm run build     # tsc -b (project references, type-check only) then vite build
npm run lint      # eslint . (flat config, eslint.config.js)
npm run preview   # preview a production build
```

There is no test runner configured (no vitest/jest in `package.json`), so don't assume `npm test` exists. Standing one up is scoped as [`tasks/009`](tasks/009-testing-foundation-unit-and-acceptance.md) (multi-phase); don't add ad hoc test tooling outside that plan.

A husky `pre-commit` hook runs `npx lint-staged`. On staged `.ts`/`.tsx` files it runs `eslint --max-warnings=0` and `tsc -p tsconfig.app.json --noEmit`, and both must pass to commit.

Path alias: `@/*` → `src/*` (configured in both `vite.config.ts` and `tsconfig.app.json`). Env vars, deploy (manual, Vercel) and the full gate details are in [`docs/reference/configuration-and-commands.md`](docs/reference/configuration-and-commands.md).

## Architecture

The full explanation, with a diagram and the reasons behind each choice, is in [`docs/explanation/architecture.md`](docs/explanation/architecture.md). Tables and store APIs are in [`docs/reference/data-model.md`](docs/reference/data-model.md), and every external call is in [`docs/reference/external-services.md`](docs/reference/external-services.md). The short version:

- **Auth is one gate.** `AuthProvider` (`src/context/AuthContext.tsx`) owns the Supabase session, and `App.tsx` shows a spinner, then `LoginPage`, then the app shell (`ThemeProvider` + `BrowserRouter` + `ErrorBoundary` + `Header` + 6 flat routes). There is no per-route auth logic.
- **`src/store/*.ts` are data-access modules, not client state.** They are plain objects of async Supabase CRUD functions with hand-written row↔domain mapping. `deckStore.ts` also carries pure deck rules (`addCardToDeck`, `setCommander`, `isCardLegalForDeck`, import/export), so treat it as two things stapled together.
- **State lives in per-feature hooks, with no global store or cache.** Each page composes hooks (`useDeckBuilder`, `useDeckVersions`, `useGallery`, `useWishlist`, `useObjectives`, `useRecommendations`, `useCardSearch`…) that fetch on mount. Navigating re-fetches, and `deckStore.getAll()` runs independently on three pages ([`tasks/008`](tasks/008-reduce-redundant-deck-refetching.md)).

**Mutation conventions: follow these when adding a write** (step-by-step guide: [`docs/how-to/dev/add-a-data-write.md`](docs/how-to/dev/add-a-data-write.md)). Store mutations throw on any Supabase error; read paths (`getAll`/`getById`/`getForDeck`) degrade to `[]`/`undefined` instead. There are two patterns, chosen by what's being written:

- **Whole-deck writes go through `useDeckAutosave`.** It serializes full-deck upserts so they can't land out of order, keeps local state on failure, and exposes a `status` for a Retry UI. `DeckDetailPage` funnels every deck mutation through `commitDeck`, and `useDeckBuilder` uses the same autosave on the builder. `useGallery` and `useDeckVersions` are pure and never call `deckStore.save` themselves. Never add a second, independent `deckStore.save` call on a page that already autosaves. The one existing exception is `ImportDeckButton`, which only renders when no saved deck is open.
- **Row-level writes (wishlist, objectives, deck delete) are optimistic.** Apply the local change, await, then reconcile or roll back on failure (`useWishlist`, `useObjectives`, `HomePage`'s delete). See [`tasks/001`](tasks/001-fix-inconsistent-mutation-error-handling.md).

**Scryfall rate limit: 2 req/s on `/cards/search` and `/cards/collection`.** New calls to those endpoints belong inside `features/recommendations/utils/scryfallRecs.ts`, on its shared 550ms schedule and session caches. Two existing callers are *not* on that schedule: `useCardSearch`, which uses a debounce plus `AbortController`/request-id, and `context/CardPriceContext.tsx`, which sends its own `/cards/collection` batches with a 500ms gap. See [`docs/how-to/dev/call-scryfall.md`](docs/how-to/dev/call-scryfall.md).

## Styling

Tailwind v4 (via `@tailwindcss/vite`) + daisyUI v5. Use semantic tokens (`base-100/200/300`, `base-content`, `primary`, `error`, etc.), not raw Tailwind palette classes. `ThemeContext` stores the theme name in `localStorage` and sets `data-theme` on `<html>`. The picker's list is the `THEMES` array in `components/ThemeDropDown/ThemeDropdown.tsx` (18 themes), which must stay in sync with the `Theme` union in `src/types/index.ts` ([`docs/how-to/dev/add-a-theme.md`](docs/how-to/dev/add-a-theme.md)). `index.html` applies the saved theme before first paint, because the loading screen, `LoginPage` and `ErrorBoundary` render above `ThemeProvider`.

- **Signature themes**: `arcane` (dark, default) and `grimoire` (light), defined in `src/index.css`. `font-display` (Cinzel) is for the logo, page titles and deck names only, never body copy. `utils/manaColors.ts` holds fixed WUBRG hues for decorative accents that should *not* follow the theme.
- **Page shell**: pages wrap in `components/PageShell` (`tone="base"` → `bg-base-100`, `tone="recessed"` → `bg-base-200`). Loading states still use per-page spinners (skeletons are `tasks/010`).
- **Icons**: use `lucide-react`. A few hand-rolled inline `<svg>` icons remain (`SwapSidebar`, `ObjectiveManager`, `HandSimulator`, `WishlistDeckFilter`); don't add more ([`tasks/005`](tasks/005-unify-icon-system.md)).
- **Duplicate chrome**: `WishlistPage` and `DeckDetailPage` still render their own in-page sticky bar with a separate "Back" button on top of the global `Header` ([`tasks/004`](tasks/004-deduplicate-page-header-chrome.md)).
- **Cohesion fixes are scoped small.** They are tasks [`002`](tasks/002-theme-aware-shell-screens.md)–[`005`](tasks/005-unify-icon-system.md). Pick one up rather than re-scoping, and don't propose styled-components or a new design-token system; that's over-engineering at this size.

**Objectives-tagging UI exists in more than one divergent implementation** ([`tasks/018`](tasks/018-shared-objectives-assignment-component.md)). Check for the existing ones before adding another tagging surface. A new one-off makes the consolidation harder.

**Strategy vs. Objectives vs. Card Roles** (see [`tasks/023`](tasks/023-objectives-semantic-clarity.md)'s amendment and [`docs/explanation/strategy-objectives-and-card-roles.md`](docs/explanation/strategy-objectives-and-card-roles.md)):
- *Strategy* is `Deck.objectives`, the deck's 1–2 plans.
- *Objectives* are the user's hand-applied per-card tags (`DeckEntry.objectiveIds`).
- *Card Roles* (ramp, draw, removal, tutor…) are detected from rules text by `detectCardRoles()` and never stored.

Don't ask users to hand-tag something a Card Role already detects, and don't call objectives "roles" in UI copy.

**Breakpoints, minimum type sizes, and the z-index scale are defined in [`docs/reference/design-tokens.md`](docs/reference/design-tokens.md).** Read it before touching layout, typography, or anything `fixed`/`sticky`/`absolute`. It also documents known current violations (arbitrary sub-12px text, ad hoc z-index values, custom z-index utilities fighting daisyUI's `dropdown-content` stacking).

**Text size on desktop: new UI keeps shipping too small, so check this on every change.**
- Any `text-xs` (12px) text must step up on desktop, as `text-xs md:text-sm`.
- Never go below `text-xs`, and never use `text-[10px]`-style arbitrary sizes.
- daisyUI size modifiers shrink text too: `btn-xs` and `badge-sm`/`badge-xs` render about 10–11px. Pair them with explicit text classes (`btn btn-xs text-xs md:btn-sm md:text-sm`), or use one size up on desktop.
- Body copy is `text-sm md:text-base`.

The full scale is in `docs/reference/design-tokens.md` §2.

## Scale-appropriate scope

This is a small app for a handful of users, so weigh new abstractions against that. The reasoning is in the "Deliberate scale limits" section of [`docs/explanation/architecture.md`](docs/explanation/architecture.md).

- **Deck versions are the most elaborate subsystem.** They have their own hooks, utils and compare UI, plus per-version objective overrides. Appending swaps to an existing version already works (`SaveVersionModal`'s `Update "<version>"` toggle → `useDeckVersions.appendToVersion`). What's still missing is renaming a version or editing its note (`updateVersion` exists, but no UI calls it) and removing a single saved swap. Both are scoped in [`tasks/007`](tasks/007-deck-version-editing-gaps.md), which needs product-owner sign-off. `VersionBuilder.tsx` and `VersionCard.tsx` aren't imported anywhere. Don't add more machinery here without checking that task first. Background: [`docs/explanation/how-deck-versions-work.md`](docs/explanation/how-deck-versions-work.md).
- `tasks/006`'s one-file cleanups (e.g. `src/pages/ObjetivesPage.tsx`'s missing "c") are still open.
- **Don't treat race-guarding as the house style.** The request-id/`AbortController` pattern belongs only where a real race exists: `useCardSearch` (fast typing) and `useRecommendations`. `HomePage`/`WishlistPage`/`DeckDetailPage` do plain fetch-on-mount with a `mounted` flag, which is fine for a single fetch.

## Where docs go

- `docs/`: user and contributor documentation, organized by Diátaxis; [`docs/README.md`](docs/README.md) is the index. Add every new page to that index in the same commit, and update the affected page when behavior changes. Conventions are in [`docs/contributing/conventions.md`](docs/contributing/conventions.md).
- `/tasks/`: granular, GitHub-issue-style write-ups of well-scoped engineering work. There's one file per issue; see `tasks/README.md` for the index and template.
- `docs/plans/`: freeform multi-step implementation plans or audit notes that don't fit the issue format. These are working docs, not documentation of current behavior.

Keep `IDEAS.md` as the product owner's single backlog of feature/bug notes. Don't let engineering scratch work leak into it.
