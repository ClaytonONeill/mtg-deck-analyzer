# 005 — Standardize on lucide-react for icons

**Labels:** `tech-debt`, `area:styling`, `priority:low`
**Estimate:** S
**Depends on:** none (do after #004 if both are in flight, to avoid touching the same header markup twice)

## Summary

`lucide-react` is already a dependency and already used in `DeckDetailPage.tsx` (`Layers`, `BarChart2`, `ChevronLeft`, `Edit3`), but other places hand-roll the equivalent icon as an inline `<svg>` instead. There's no reason for both to exist in the same app.

## Background

Known inline-SVG spots to replace:

- `src/pages/DeckBuilderPage.tsx` — back-chevron icon in its header (~lines 69–83). Equivalent already used elsewhere: `ChevronLeft` (as seen in `DeckDetailPage.tsx`).
- `src/pages/DeckBuilderPage.tsx` — warning-triangle icon in the partner-conflict alert (~lines 171–183) and the color-identity alert (~lines 237–249). Equivalent: lucide `AlertTriangle`.
- `src/components/Header/Header.tsx` — hamburger/close icon for the mobile menu toggle (~lines 105–126). Equivalent: lucide `Menu`/`X`.

Do a repo-wide search for `<svg` inside `src/` before starting, since this list was compiled from the pages read during the initial audit and may not be exhaustive — components under `features/` weren't all checked for this specifically.

## Acceptance Criteria

- [ ] Every hand-rolled inline `<svg>` icon in `src/` that duplicates an icon already available in `lucide-react` is replaced with the lucide component.
- [ ] Icon sizing/color (`className`, `size`/`strokeWidth` props) matches the surrounding button's existing visual weight — check side-by-side in the browser, not just that it compiles.
- [ ] No behavior change — these are all decorative/inside-button icons with no independent click handlers of their own.

## Files / Areas Touched

- `src/pages/DeckBuilderPage.tsx`
- `src/components/Header/Header.tsx`
- Any other inline `<svg>` found during the repo-wide search

## Out of Scope

- Icons that don't have a reasonable lucide equivalent (unlikely, but if found, leave as inline SVG rather than forcing a bad substitute) — note any such exceptions in the PR description.
- The MTG mana-symbol icons (`src/components/ManaSymbol/`) — those render actual mana-color glyphs, not generic UI icons, and are a different concern entirely. Do not touch.
