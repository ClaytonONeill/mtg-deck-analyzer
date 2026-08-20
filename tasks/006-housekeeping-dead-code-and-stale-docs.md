# 006 — Housekeeping: dead code + stale docs

**Labels:** `chore`, `priority:low`
**Estimate:** XS
**Depends on:** none

## Summary

A grab-bag of small, independent, low-risk cleanups found during the initial audit. Each item is a one-file change — feel free to do them individually or all in one small PR.

## Subtasks

- [ ] **Remove unused `useLocalStorage` hook.** `src/hooks/useLocalStorage.ts` has no callers anywhere in the app (confirmed via a repo-wide search — the only match was the file's own definition). Delete it. Re-search before deleting in case something was added since this was written.
- [ ] **Rename `ObjetivesPage.tsx` → `ObjectivesPage.tsx`.** The file is missing a "c" (`Objetives`) while every other reference in the app — the route, the component name, the page title, `objectivesStore`, `useObjectives` — spells it correctly. It's only ever imported once, in `App.tsx` (`import ObjectivesPage from "./pages/ObjetivesPage"`), so this is a low-risk rename. Update the import path after renaming.
- [ ] **Reconcile `IDEAS.md`'s "Themes" section with reality.** It currently reads as an unbuilt feature request, but a theme switcher already exists (`Header.tsx`'s theme `<select>` + `src/context/ThemeContext.tsx`, ~16 daisyUI themes). Either delete the section or replace it with whatever's actually still missing from that idea (e.g. if the original ask included curated MTG-flavored themes like "Vampire"/"Forest" beyond daisyUI's stock list — check with the product owner before assuming that part is also done, since daisyUI does ship a stock `forest` theme but not a stock `vampire` one).

## Files / Areas Touched

- `src/hooks/useLocalStorage.ts` (delete)
- `src/pages/ObjetivesPage.tsx` → `src/pages/ObjectivesPage.tsx`, `src/App.tsx` (import path)
- `IDEAS.md`

## Out of Scope

- Any other file rename or dead-code removal not listed above — this task is intentionally narrow; if you spot more while working, note it rather than expanding scope here.
