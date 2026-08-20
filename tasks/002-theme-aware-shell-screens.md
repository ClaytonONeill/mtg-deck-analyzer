# 002 — Make the loading screen and error boundary theme-aware

**Labels:** `bug`, `area:styling`, `priority:medium`
**Estimate:** S
**Depends on:** none

## Summary

`App.tsx`'s top-level loading screen and `ErrorBoundary`'s fallback UI are the only two screens in the app that use hardcoded Tailwind colors instead of daisyUI semantic tokens, so they don't respond to the user's selected theme (`ThemeContext`/`Header`'s theme `<select>`) the way every other screen does.

## Background

`src/App.tsx` (loading state):

```tsx
<div className="min-h-screen bg-slate-950 flex items-center justify-center">
  <p className="text-slate-400">Loading...</p>
</div>
```

`src/components/ErrorBoundary/ErrorBoundary.tsx` (fallback UI): `bg-slate-950`, `text-white`, `text-slate-400`, `text-slate-500`, `bg-slate-900`, `border-slate-800`, `text-red-400`, and a hardcoded `bg-[#1971c2]` button.

Everywhere else in the app, colors come from daisyUI tokens (`bg-base-100`, `text-base-content`, `text-error`, `btn-primary`, etc.) which redraw automatically when `data-theme` changes on `<html>` (see `src/context/ThemeContext.tsx`). These two screens don't, which is jarring if a themed session hits an error or the initial auth-loading state.

Note: `App.tsx`'s loading screen renders *before* `ThemeProvider` mounts (auth loading happens above the `ThemeProvider` in the tree), so `data-theme` may not be set on `<html>` yet on first load — confirm whether `data-theme` persists from `localStorage` via `ThemeProvider`'s effect running before paint, or whether this screen needs to just use sensible default tokens that look fine unthemed. Investigate before assuming a one-line class swap is sufficient.

## Acceptance Criteria

- [ ] `App.tsx`'s loading screen uses daisyUI tokens (e.g. `bg-base-100`/`text-base-content`) instead of hardcoded slate colors.
- [ ] `ErrorBoundary`'s fallback screen uses daisyUI tokens throughout (background, text, borders, the "Take me home" button as `btn btn-primary`, the "Try again" button as `btn btn-outline` or similar).
- [ ] Confirm in the browser, with at least two different themes selected (e.g. `dark` and `light` or `forest`), that both screens visually match the rest of the app in that theme. (Trigger the error boundary manually, e.g. by temporarily throwing in a component, to check it — don't ship a permanent way to trigger it.)
- [ ] No visual regression to `App.tsx`'s loading screen appearing correctly before a theme is established (first-ever visit, no `localStorage` value yet).

## Files / Areas Touched

- `src/App.tsx`
- `src/components/ErrorBoundary/ErrorBoundary.tsx`

## Out of Scope

- Wiring `ErrorBoundary` up to an external logger (there's already a `// Safe to wire up to an external logger here later e.g. Sentry` comment — that's a separate, deliberate future task, not part of this one).
- Any other screen — this task is scoped to just these two.
