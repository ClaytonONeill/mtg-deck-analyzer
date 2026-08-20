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

Estimate key: XS (<1hr), S (<half day), M (~1 day), L (multi-day / multi-session).
