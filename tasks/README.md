# Tasks

GitHub-issue-style write-ups of findings from the initial senior-engineer pass over this codebase (see root `CLAUDE.md` for the full architecture/style summary these come from). Each file is scoped to be pickable and mergeable on its own — read the "Files / Areas Touched" and "Out of Scope" sections before starting so work stays inside the stated boundary.

None of these require live database access. If a task turns out to need it, stop and ask before touching Supabase.

## Index

| # | Title | Type | Priority | Estimate |
|---|-------|------|----------|----------|
| [001](001-fix-inconsistent-mutation-error-handling.md) | Fix inconsistent / silently-broken error handling in mutations | bug | High | M |
| [002](002-theme-aware-shell-screens.md) | Make the loading screen and error boundary theme-aware | bug | Medium | S |
| [003](003-shared-page-shell-component.md) | Extract a shared page-shell/loading component | tech-debt | Medium | S |
| [004](004-deduplicate-page-header-chrome.md) | De-duplicate in-page "back" header chrome | tech-debt | Low | S |
| [005](005-unify-icon-system.md) | Standardize on lucide-react for icons | tech-debt | Low | S |
| [006](006-housekeeping-dead-code-and-stale-docs.md) | Housekeeping: dead code + stale docs | chore | Low | XS |
| [007](007-deck-version-editing-gaps.md) | Finish deck-version editing (rename/note, per-swap removal) | bug / feature | Medium | M |
| [008](008-reduce-redundant-deck-refetching.md) | Reduce redundant deck-list refetching across pages | enhancement | Low | S |
| [009](009-testing-foundation-unit-and-acceptance.md) | Establish a testing foundation (unit + acceptance) | infra | High | L (multi-phase) |
| [010](010-skeleton-loading-states.md) | Replace spinner+text loading states with skeleton placeholders | enhancement | Low | S |
| [011](011-autosave-deck-builder.md) | Auto-save the deck builder on card add | enhancement | Medium | S |
| [012](012-card-token-suggestions.md) | Card/token suggestions for a deck | feature | Low | L |
| [013](013-double-faced-card-images.md) | Support double-faced card images and flipping | bug / feature | Medium | M |
| [014](014-compare-decks.md) | Compare decks against each other, not just versions | feature | Low | L |
| [015](015-multi-key-sub-sorting.md) | Multi-key sub-sorting in gallery and wishlist | enhancement | Low | S |
| [016](016-commander-in-gallery-view.md) | Show commander/partner cards in Gallery view | enhancement | Low | XS |
| [017](017-fix-new-deck-navigation-bug.md) | Fix "New Deck" not resetting builder state from Edit Deck view | bug | Medium | S |
| [018](018-shared-objectives-assignment-component.md) | Consolidate objectives-assignment UI into one shared component | tech-debt | Medium | M |
| [019](019-simulator-objectives-reset.md) | Let hidden simulator objectives be re-shown without a full reset | bug | Low | XS |
| [020](020-confirm-delete-version.md) | Extend the confirm-delete modal to deck-version deletion | bug | Medium | XS |
| [021](021-enforce-duplicate-card-check-everywhere.md) | Enforce the duplicate-card check on import and version-swap | bug, partial-product-input | Medium | S |
| [022](022-fix-card-search-results-overflow.md) | Fix card search results dropdown bleeding outside its container | bug | Medium | S |
| [023](023-objectives-semantic-clarity.md) | Clarify deck-level strategy vs. card-level roles in objectives | design | Medium | M |

All of 010–022 originate from `IDEAS.md` items that had no task file yet as of 2026-08-20 — each cites the specific IDEAS.md entry it covers and notes where reality already diverges from that entry's description (partially built, already fixed, etc.). 023 addresses a new semantic-clarity concern that emerged during design review.

Estimate key: XS (<1hr), S (<half day), M (~1 day), L (multi-day / multi-session).
