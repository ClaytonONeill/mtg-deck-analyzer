# Conventions and workflow

This page lists the rules a code or documentation change must follow, and where each kind of work-tracking document lives.

For installing and running the app locally, see [Development setup](development-setup.md).

## Code conventions

### Data writes

| Rule | Detail |
|---|---|
| Store errors | Store mutations in `src/store/*.ts` throw on a Supabase error. Read paths (`getAll`, `getById`, `getForDeck`) return `[]` or `undefined` instead. |
| Whole-deck writes | Go through `useDeckAutosave` (`src/hooks/useDeckAutosave.ts`), which serializes full-deck upserts. On `DeckDetailPage`, every deck mutation goes through its `commitDeck`. |
| No second save | A page that already autosaves must not add an independent `deckStore.save` call. `useGallery` and `useDeckVersions` never call `deckStore.save`. |
| Row-level writes | Wishlist, objectives, and deck deletion are optimistic: apply the local change, await the store call, then reconcile or roll back on failure. |
| Database access | Changes must not read or write the live Supabase project (tables, RLS policies, storage, auth users) unless the task explicitly includes that work. `.env.local` values must not be printed or logged. |

The reasons behind the two write patterns are in [Architecture overview](../explanation/architecture.md). Steps for adding a write are in [Add a data write](../how-to/dev/add-a-data-write.md).

### Styling

| Rule | Detail |
|---|---|
| Color | Use daisyUI semantic tokens (`base-100`/`200`/`300`, `base-content`, `primary`, `error`, and so on), not raw Tailwind palette classes. |
| Fixed accents | Decorative WUBRG hues that must not follow the theme come from `src/utils/manaColors.ts`. |
| Display font | `font-display` (Cinzel) is for the logo, page titles, and deck names only. It is never used for body copy. |
| Page wrapper | Pages wrap in `components/PageShell`: `tone="base"` gives `bg-base-100`, `tone="recessed"` gives `bg-base-200`. |
| Icons | Use `lucide-react`. Do not add new hand-rolled inline `<svg>` icons. Some inline SVGs remain in `src/`; replacing them is tracked in [`tasks/005`](../../tasks/005-unify-icon-system.md). |
| Objectives tagging UI | Check for the existing implementations before adding another objectives-tagging surface. Consolidation is tracked in [`tasks/018`](../../tasks/018-shared-objectives-assignment-component.md). |
| Terminology | In UI copy, Objectives are never called "roles". Card Roles are detected by `detectCardRoles()` and are never hand-tagged. See [Strategy, Objectives, and Card Roles](../explanation/strategy-objectives-and-card-roles.md). |

### Text size

| Rule | Detail |
|---|---|
| Floor | `text-xs` (12px) is the smallest allowed size. |
| Arbitrary sizes | `text-[10px]`, `text-[9px]`, or any `text-[Npx]` below 12px is not allowed. |
| Desktop step-up | Any `text-xs` text steps up on desktop: `text-xs md:text-sm`. |
| Body copy | `text-sm md:text-base`. |
| daisyUI size modifiers | `btn-xs`, `badge-sm`, and `badge-xs` render at about 10–11px. Pair them with explicit text classes, for example `btn btn-xs text-xs md:btn-sm md:text-sm`, or use one size up on desktop. |

The full type scale is in [Design tokens](../reference/design-tokens.md) §2.

### Layout and stacking

| Rule | Detail |
|---|---|
| Breakpoints | Stock Tailwind v4 breakpoints (`sm` 640px, `md` 768px, `lg` 1024px, `xl` 1280px, `2xl` 1536px), mobile-first. No custom breakpoints. |
| Mobile width | Any `flex-row` or layout change must work at a 375px viewport width. The product owner tests on a phone. |
| z-index | Use the app-level scale in [Design tokens](../reference/design-tokens.md) §3. Do not put a custom z-index utility on daisyUI's `dropdown-content`. |

### Path alias

`@/*` resolves to `src/*`. It is configured in both `vite.config.ts` and `tsconfig.app.json`.

## Verification

There is no test runner. `package.json` has no `test` script and no vitest or jest dependency. Do not add ad hoc test tooling; a testing foundation is scoped in [`tasks/009`](../../tasks/009-testing-foundation-unit-and-acceptance.md).

A change is verified by:

| Check | Command or method |
|---|---|
| Lint | `npm run lint` (`eslint .`) |
| Type-check and build | `npm run build` (`tsc -b && vite build`) |
| Behavior | Manual check in the browser on `npm run dev`, including a 375px-wide viewport for layout changes |

### Pre-commit hook

`.husky/pre-commit` runs `npx lint-staged`. The `lint-staged` block in `package.json` runs:

| Staged files | Command |
|---|---|
| `src/**/*.{ts,tsx}` | `npx eslint --max-warnings=0` |
| `**/*.{ts,tsx}` | `npx tsc -p tsconfig.app.json --noEmit` |

Both must pass for the commit to succeed. A commit that stages no `.ts`/`.tsx` files runs neither command. Documentation-only commits are checked by confirming every relative Markdown link points at a file that exists.

## Branches and pull requests

| Rule | Detail |
|---|---|
| Work branch | Work happens on a named branch, never directly on `master`. |
| Default branch | `master` |
| Integration branch | Git history shows feature pull requests merging into `development` (for example PR #72 from `major-updates`), and `development` merging into `master` (for example PR #69). |

> TODO(product owner): confirm whether new branches should start from and open pull requests against `master` or `development`. The planned rule was "branch off `master`, PR into `master`", but recent history routes feature PRs through `development`.

Production deploys are manual through Vercel (`vercel --prod` or the Vercel dashboard). Merging a pull request does not deploy.

## Where things go

| Location | Contents | Rules |
|---|---|---|
| `IDEAS.md` (repo root) | The product owner's backlog of feature and bug notes. | Owned by the product owner. Engineering scratch work does not go here. Entries can be stale in either direction; check the code before treating an entry as unbuilt. |
| `tasks/` | GitHub-issue-style write-ups of scoped engineering work, one file per issue (`NNN-short-name.md`). | Keep the index table in [`tasks/README.md`](../../tasks/README.md) and each task's checkboxes current as work lands. Stay inside a task's "Files / Areas Touched" and "Out of Scope" sections. If a task turns out to need database access, stop and ask. |
| `docs/plans/` | Working documents for multi-step efforts: implementation plans, audit notes, migration write-ups. One file per effort, named for the topic, not the date. | See [`docs/plans/README.md`](../plans/README.md). |
| `docs/` (other folders) | Diátaxis documentation: `tutorials/`, `how-to/`, `reference/`, `explanation/`, `contributing/`. | A change that adds a page also adds its link to [`docs/README.md`](../README.md) in the same commit. |

## Agent instructions

`CLAUDE.md` at the repo root is the binding instruction file for AI coding agents. It summarizes the architecture, the write and styling conventions above, and scope limits for this app. Where `CLAUDE.md` and this page differ, the code on the current branch is the source of truth, and both documents are corrected to match.

## Related documents

- [Development setup](development-setup.md)
- [Architecture overview](../explanation/architecture.md)
- [Design tokens](../reference/design-tokens.md)
- [Configuration and commands](../reference/configuration-and-commands.md)
