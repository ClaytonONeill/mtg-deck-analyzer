# 009 — Establish a testing foundation (unit + acceptance)

**Labels:** `infra`, `testing`, `priority:high`
**Estimate:** L (multi-phase — treat each phase below as its own independently-mergeable PR)
**Depends on:** none, but Phase 1's value is highest once #001's error-handling fixes land, since that's exactly the kind of regression tests should catch

## Summary

There are currently zero automated tests of any kind (no unit tests, no acceptance/e2e tests — no test runner is even installed). Combined with the amount of hand-refactoring this app has already been through across different AI-assisted sessions, this means every change is a manual-regression-test exercise, and it's easy for a "small" fix in one feature hook to silently break another page that shares the same store. This task sets up the infrastructure and a first, deliberately small slice of coverage — it is not asking for 100% coverage in one pass.

## Recommended stack (confirm before starting — see Phase 0)

- **Unit / component tests:** [Vitest](https://vitest.dev/) (shares config/transforms with the existing Vite setup, near-zero extra tooling) + [React Testing Library](https://testing-library.com/react) for anything that renders components.
- **Acceptance / end-to-end tests:** [Playwright](https://playwright.dev/). Drives a real browser against the running dev/preview build, which is what "AT" should mean here — real user flows, not mocked-component flows.
- Both are widely-used, well-documented, and proportionate to this app's size — avoid reaching for anything heavier (e.g. a full BDD framework on top).

## Phase 0 — Decide scope and get product-owner sign-off

- [ ] Confirm the stack above (or an alternative) with the product owner.
- [ ] **Decide how acceptance tests will handle Supabase.** This app talks directly to a live Supabase project from the browser (`src/lib/supabase.ts`) with no server-side seam. Acceptance tests need one of:
  - a dedicated **test Supabase project** (separate URL/anon key, seeded/reset between runs) — most realistic, but requires the product owner to actually provision it (this is exactly the kind of "explicit permission for DB access" call-out from `CLAUDE.md` — don't set this up unilaterally), or
  - **network-level mocking** (e.g. Playwright's route interception, or [MSW](https://mswjs.io/)) so tests never hit a real Supabase project at all.
  Get a decision before starting Phase 3 — it changes how much setup work that phase is.
- [ ] Decide whether tests should run in the existing husky `pre-commit` hook (probably too slow for unit+e2e both — recommend unit tests stay fast enough for `lint-staged`/pre-commit if desired, and e2e tests run manually / in CI only) or only via an `npm run test` command a developer runs by hand. This repo has no CI configured today (no `.github/workflows`) — setting one up is a reasonable follow-on but is its own decision, not assumed as part of this task.

## Phase 1 — Unit test infrastructure + first pure-function coverage

- [ ] Install and configure Vitest (respecting the existing `@/*` path alias from `vite.config.ts`/`tsconfig.app.json`).
- [ ] Add an `npm run test` (and `npm run test:watch`) script.
- [ ] Write unit tests for the pure, side-effect-free logic that already exists and is currently the highest-value/lowest-effort target:
  - `src/store/deckStore.ts`'s pure helpers: `addCardToDeck`, `removeCardFromDeck`, `setCommander`, `setPartner`, `removePartner`, `isCardLegalForDeck`, `getDeckCardCount`, `isValidDeck` (via `importDeckFromFile`'s validation branch).
  - `src/features/deckBuilder/utils/partnerUtils.ts` (`mergeColorIdentities`, `isValidPartner`, `getPartnerInfo`).
  - `src/features/deckVersions/utils/versionUtils.ts` (`applyVersionToDeck`).
  - `src/features/metrics/utils/deckMetrics.ts` (`getTypeBreakdown`, `getCMCBreakdown`) and `chartColors.ts`.
  - `src/utils/utils.ts` (`inferCategory`).
  - `WishlistPage.tsx`'s local `sortEntries`/`applyFilters`/`activeFilterCount` — consider extracting these to `src/features/wishlist/utils/` as part of this work so they're independently testable and reusable, rather than trapped in the page file (small, in-scope refactor, not a redesign).
- [ ] These are exactly the functions #001 will be touching (`deckStore`'s error handling) — coordinate ordering with whoever picks up #001 so tests land against the corrected behavior, not the buggy one.

## Phase 2 — Component tests for representative components

Keep this phase small and representative rather than exhaustive — the goal is to prove the pattern works and cover the highest-risk components, not to hit every component in `src/`.

- [ ] Set up React Testing Library + jsdom (or Vitest's browser mode, per what's decided in Phase 0) and a test-only way to provide `AuthContext`/`ThemeContext` without hitting real Supabase (e.g. a test wrapper/provider).
- [ ] Cover: `Header.tsx` (theme switch persists to `localStorage` and sets `data-theme`; nav buttons hide/show based on current route), `EmptyState.tsx`/`DeckCard.tsx` (presentational, low-risk starting point), `FilterSection.tsx` (filter state changes call `onChange` correctly — this one has real logic worth protecting).
- [ ] Mock the `store` modules at the module boundary (`vi.mock('@/store/deckStore')` etc.) rather than mocking `fetch`/Supabase directly, so these tests don't depend on Phase 0's Supabase decision.

## Phase 3 — Acceptance tests for the golden path

- [ ] Implement whatever Supabase strategy was decided in Phase 0.
- [ ] Cover the golden path end-to-end: sign in → create a deck → search and set a commander → add cards → save → land on deck detail → view metrics tab → add a wishlist card → tag it to the deck.
- [ ] Cover one or two known-fragile edge cases surfaced during the initial audit as regression protection, e.g.: the version-compare flow (there's a known "stale chart bar modal" bug tracked in `IDEAS.md` — writing a test that currently fails/xfails here is a reasonable way to document it), and a failed-save scenario once #001 lands (assert the UI actually shows the rollback, not just that it doesn't crash).

## Phase 4 — Wire into the dev workflow (optional, discuss with product owner)

- [ ] If desired: add a GitHub Actions workflow (or whatever CI the product owner wants) that runs `npm run lint`, `npm run build`, and `npm run test` on PRs. This repo has no CI today — don't assume one is wanted without asking.

## Files / Areas Touched

- New: `vitest.config.ts` (or config merged into `vite.config.ts`), `playwright.config.ts`, test files colocated or under a `__tests__`/`tests` convention (pick one and note it in `CLAUDE.md`'s Commands section once decided, so future sessions know where to look).
- `package.json` (new scripts + devDependencies)
- Possibly `src/features/wishlist/utils/` (new, if extracting `WishlistPage`'s inline sort/filter logic per Phase 1)
- `.github/workflows/` (only if Phase 4 is approved)

## Out of Scope

- 100% coverage of any kind — this task's job is to stand up the infrastructure and prove the pattern on a deliberately small, high-value slice.
- Visual regression testing.
- Load/performance testing — not relevant at this app's scale.
