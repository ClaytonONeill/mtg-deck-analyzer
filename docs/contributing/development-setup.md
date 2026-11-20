# Development setup

Use this guide to get MTG Deck Analyzer running on your machine and make sure your changes will pass the pre-commit hook.

## Goal

By the end you will have the Vite dev server running against the project's Supabase backend, you'll be signed in, and your clone will have the git hooks that check every commit. This guide assumes you know Git, npm, and a terminal.

## Prerequisites

- **Node.js 22 LTS** and the npm that comes with it.
- **Git**, plus a `bash` on your `PATH`. The pre-commit type-check runs through `bash -c`, so on Windows use Git Bash or another shell that provides `bash`.
- **The Supabase URL and anon key** for the project. Get them from the product owner. They aren't in the repository.

## Steps

### 1. Clone the repository and install dependencies

```bash
git clone https://github.com/ClaytonONeill/mtg-deck-analyzer.git
cd mtg-deck-analyzer
npm install
```

`npm install` runs the `prepare` script (`husky`), which installs the git hooks. To confirm, run:

```bash
git config core.hooksPath
```

You should see `.husky/_`.

### 2. Create `.env.local`

In the repository root, create a file named `.env.local` that contains the two variables the Supabase client reads:

```bash
VITE_SUPABASE_URL=<project URL from the product owner>
VITE_SUPABASE_ANON_KEY=<anon key from the product owner>
```

Never commit this file. `.gitignore` already ignores it through the `*.local` pattern. To confirm, run `git status`; `.env.local` should not appear in the output.

If either variable is missing, the app throws `Missing Supabase environment variables` on startup (`src/lib/supabase.ts`).

### 3. Start the dev server

```bash
npm run dev
```

Open the local URL that Vite prints (by default `http://localhost:5173`).

### 4. Sign in

The whole app sits behind the login screen. Enter your email and password and select **Sign In**.

If you don't have an account yet, select **Don't have an account? Sign up**, fill in the form, and select **Create Account**. Then follow the confirmation email ("Check your email to confirm your account.") before you sign in.

> TODO(product owner): confirm whether new contributors should self-register through **Sign up** or have an account created for them in the Supabase project.

Your local app talks to the same live Supabase project as everyone else, so any deck you create or change is real data.

### 5. Check your changes before you commit

Run the same checks the hook enforces, and the full build:

```bash
npm run lint    # eslint . across the repo
npm run build   # tsc -b type-check, then vite build
```

When you commit, the husky `pre-commit` hook runs `npx lint-staged`. Depending on which files you staged, it runs:

| Staged files | Command |
| --- | --- |
| `src/**/*.{ts,tsx}` | `npx eslint --max-warnings=0` on those files |
| any `*.{ts,tsx}` | `npx tsc -p tsconfig.app.json --noEmit`, which type-checks the whole app, not just the staged files |

Any ESLint warning or type error blocks the commit. Commits that only touch Markdown or other non-TypeScript files skip both checks.

There is no test runner, so `npm test` doesn't exist. Instead, check your change by hand in the browser.

## Final result

You're set up when all of these are true:

- `npm run dev` serves the app and you can sign in and see your decks.
- `npm run lint` and `npm run build` finish without errors.
- A commit that includes a `.ts` or `.tsx` change runs `lint-staged` before Git records it.

## Next steps

- [Configuration and commands](../reference/configuration-and-commands.md): every npm script, environment variable, and config file.
- [Conventions and workflow](conventions.md): the rules a change must follow, and where planning docs live.
- [Troubleshooting](../troubleshooting.md): fixes for setup and commit-hook failures.
