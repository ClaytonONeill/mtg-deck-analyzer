# Configuration and commands

This page lists the environment variables, npm scripts, build configuration, commit gates, and deployment settings for MTG Deck Analyzer.

For first-time setup steps, see [Development setup](../contributing/development-setup.md).

## Runtime requirements

| Item | Value |
| --- | --- |
| Node.js | 22 LTS (confirmed by the product owner; `package.json` has no `engines` field and the repo has no `.nvmrc`) |
| Package manager | npm (`package-lock.json` is committed) |

## Environment variables

Vite exposes only variables prefixed with `VITE_` to browser code. The app reads exactly two, both in `src/lib/supabase.ts`.

| Variable | Required | Used for |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Yes | Supabase project URL passed to `createClient()` |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anon (public) key passed to `createClient()` |

| Property | Value |
| --- | --- |
| File | `.env.local` at the repo root |
| Git status | Ignored by the `*.local` pattern in `.gitignore` |
| Loaded by | Vite, in every mode (`dev`, `build`, `preview`) |
| Inlined at | Build time. A production build embeds the values present when `vite build` ran. |

If either variable is missing or empty, `src/lib/supabase.ts` throws this error when the module loads:

```text
Error: Missing Supabase environment variables
```

No Supabase client is created and the app does not start.

> **Warning:** `.env.local` holds project credentials. Do not commit it, print it, or paste its values into issues or logs.

No other `import.meta.env` variables are read anywhere in `src/`.

## npm scripts

Defined in `package.json`.

| Script | Command | Behavior |
| --- | --- | --- |
| `npm run dev` | `vite` | Starts the Vite dev server with hot module replacement. The port is Vite's default (`5173`); `vite.config.ts` does not override it. |
| `npm run build` | `tsc -b && vite build` | Type-checks every TypeScript project reference, then bundles to `dist/`. The build stops if the type-check fails. `tsc` emits no files (`noEmit: true`). |
| `npm run lint` | `eslint .` | Lints the repo with the flat config in `eslint.config.js`. |
| `npm run preview` | `vite preview` | Serves the existing `dist/` build locally. Run `npm run build` first. |
| `prepare` | `husky` | Runs automatically after `npm install` and installs the Git hooks in `.husky/`. |

There is no `test` script. See [Not present](#not-present).

## Build configuration

### Vite (`vite.config.ts`)

| Setting | Value |
| --- | --- |
| Plugins | `@vitejs/plugin-react`, `@tailwindcss/vite` |
| `resolve.alias` | `@` → `./src` |
| Output directory | `dist/` (Vite default) |

### Path alias

`@/*` resolves to `src/*`. The alias is defined in three places and they must agree:

| File | Setting |
| --- | --- |
| `vite.config.ts` | `resolve.alias: { "@": path.resolve(__dirname, "./src") }` |
| `tsconfig.app.json` | `compilerOptions.paths: { "@/*": ["./src/*"] }` |
| `tsconfig.json` | `compilerOptions.paths: { "@/*": ["./src/*"] }` |

Example:

```ts
import { AuthProvider } from "@/context/AuthContext";
```

### TypeScript project references

`tsconfig.json` is a solution file. It compiles no files itself (`"files": []`) and references two projects. `tsc -b` checks both.

| Project | `include` | `lib` | `types` | Notes |
| --- | --- | --- | --- | --- |
| `tsconfig.app.json` | `src` | `ES2023`, `DOM`, `DOM.Iterable` | `vite/client` | `jsx: react-jsx` |
| `tsconfig.node.json` | `vite.config.ts` | `ES2023` | `node` | Config-file code only |

Shared compiler options in both projects:

| Option | Value |
| --- | --- |
| `target` | `ES2023` |
| `module` | `ESNext` |
| `moduleResolution` | `bundler` |
| `noEmit` | `true` |
| `strict` | `true` |
| `noUnusedLocals` | `true` |
| `noUnusedParameters` | `true` |
| `erasableSyntaxOnly` | `true` |
| `noFallthroughCasesInSwitch` | `true` |
| `noUncheckedSideEffectImports` | `true` |
| `verbatimModuleSyntax` | `true` |
| `allowImportingTsExtensions` | `true` |
| `skipLibCheck` | `true` |

Build info files are written to `node_modules/.tmp/`.

### ESLint (`eslint.config.js`)

| Setting | Value |
| --- | --- |
| Format | Flat config (`defineConfig`) |
| Ignored | `dist` |
| Files | `**/*.{ts,tsx}` |
| Extends | `@eslint/js` recommended, `typescript-eslint` recommended, `eslint-plugin-react-hooks` flat recommended, `eslint-plugin-react-refresh` Vite config |
| `ecmaVersion` | `2020` |
| Globals | Browser |

## Pre-commit gate

`.husky/pre-commit` runs one command:

```sh
npx lint-staged
```

`lint-staged` reads its rules from the `lint-staged` key in `package.json`:

| Staged files matching | Command | Effect |
| --- | --- | --- |
| `src/**/*.{ts,tsx}` | `npx eslint --max-warnings=0` | Lints the staged files. Any error or warning fails the commit. |
| `**/*.{ts,tsx}` | `bash -c 'npx tsc -p tsconfig.app.json --noEmit'` | Type-checks the whole `tsconfig.app.json` project, not only the staged files. Any type error fails the commit. |

Constraints:

- Both rules must pass for the commit to succeed.
- A commit that stages no `.ts` or `.tsx` files (for example, Markdown only) runs neither rule.
- The type-check rule checks `tsconfig.app.json` only. `tsconfig.node.json` (`vite.config.ts`) is checked by `npm run build`, not by the hook.
- The hook requires `bash` on the `PATH`.

## Deployment

| Item | Value |
| --- | --- |
| Host | Vercel |
| Trigger | Manual: `vercel --prod` from the CLI, or a deploy from the Vercel dashboard (confirmed by the product owner) |
| Config file | `vercel.json` |

`vercel.json` contains one SPA rewrite:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

Every request path is served `index.html`, so client-side routes from `react-router-dom` load correctly on refresh or direct link.

`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` must be available wherever `vite build` runs for a deploy, because Vite inlines them into the bundle (see [Environment variables](#environment-variables)).

> TODO(product owner): confirm where the production Supabase variables are set (Vercel project environment variables or a local `.env.local` used with `vercel --prod`).

## Not present

| Item | Status |
| --- | --- |
| Test runner | None. `package.json` has no `test` script and no Vitest or Jest dependency. The planned setup is [tasks/009](../../tasks/009-testing-foundation-unit-and-acceptance.md). |
| `.env.example` | None. The variable names are listed in [Environment variables](#environment-variables). |
| CI workflow | None. Commit checks run only in the local pre-commit hook. |

## Related

- [Development setup](../contributing/development-setup.md): first-time setup using these commands
- [Troubleshooting](../troubleshooting.md): missing env vars and pre-commit failures
- [External services](external-services.md): what the Supabase variables connect to
