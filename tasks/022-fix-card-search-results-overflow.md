# 022 — Fix card search results dropdown bleeding outside its container

**Labels:** `bug`, `area:styling`, `priority:medium`
**Estimate:** S
**Depends on:** none, but reads on the same z-index audit as [`docs/design-tokens.md`](../docs/design-tokens.md)'s known-violations section — check that doc before picking a new z-index value.

## Summary

`IDEAS.md`: "When the card search results list is shown, it bleeds outside of the page container and has a buggy rearrangement of content." Traced to `CardSearchPanel`'s results dropdown, which shares its `z-100` value with two unrelated overlays by coincidence rather than design.

## Background

`src/features/deckBuilder/components/CardSearchPanel.tsx:151-154` — the results `<ul>` is `absolute left-0 right-0 z-100 ... max-h-100 overflow-y-auto` inside a `relative` `form-control` container (line 118).

Per `docs/design-tokens.md:73`, this `z-100` is flagged as one of three unrelated overlays sharing one value by coincidence (also used by `SwapSidebar.tsx`'s fullscreen zoom and `HandSimulator.tsx`'s toast) — read that doc's broader z-index section (lines 62-99) before touching this, since it documents other live stacking bugs in the same area (`z-[1]`/`z-[20]` fighting daisyUI's built-in `dropdown-content: 999`, `CardImageTooltip.tsx`'s `z-[9999]`) that a narrow fix here shouldn't make worse.

`CardSearchPanel` renders in two different layout contexts — `DeckBuilderPage.tsx` (commander/partner/"The 99" search) and `SwapSidebar.tsx` (replacement search) — the dropdown sits inside differently-constrained flex/grid parents in each, so reproduce and verify the fix in both.

## Acceptance Criteria

- [ ] The results dropdown stays visually contained within its intended bounds (doesn't bleed past the page/panel edge) in both `DeckBuilderPage` and `SwapSidebar` contexts.
- [ ] No "buggy rearrangement" of surrounding content when the dropdown opens (likely an absolute-positioning/overflow-parent issue — check whether an ancestor has `overflow: hidden`/`clip` unintentionally clipping it, or whether the dropdown's position should be `fixed`/portal-rendered instead of `absolute` within a scrollable ancestor).
- [ ] Resolve the z-index value per `docs/design-tokens.md`'s guidance rather than picking another ad hoc number — if that doc doesn't yet define a proper token scale, coordinate with whoever picks that up (or introduce a minimal, documented value for "search dropdown" specifically).
- [ ] Verify against daisyUI's built-in `dropdown-content` stacking behavior doesn't fight this component, per the doc's known-issue note.

## Files / Areas Touched

- `src/features/deckBuilder/components/CardSearchPanel.tsx`
- Possibly `docs/design-tokens.md` (if a new documented z-index value is introduced as part of the fix)

## Out of Scope

- Fixing every other z-index issue catalogued in `docs/design-tokens.md` — this task is scoped to the search-results dropdown only; the rest is tracked in that doc for separate follow-up.
