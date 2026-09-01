# 019 — Let hidden simulator objectives be re-shown without a full reset

**Labels:** `bug`, `area:simulator`, `priority:low`
**Estimate:** XS
**Depends on:** none

## Summary

`IDEAS.md` ("Deck Objective Overhaul") describes two problems with the hand-simulator's objectives panel. One is already fixed; the other is a real, narrow bug.

## Background

`src/features/simulator/components/HandSimulator.tsx`:

- "Only relevant/encountered objectives should show, not the full list" — **already implemented.** `activeObjectives = objectives.filter((o) => (sim.objCounts[o.id] ?? 0) > 0)` (lines 241-243) already limits the panel to objectives actually drawn. `IDEAS.md` is stale on this half — no work needed here.
- "No way to turn hidden objectives back on without resetting the whole page" — **confirmed real.** `toggleObjective` (lines 106-116) adds/removes ids from a `hiddenObjectives` Set; the only place that clears it is `reset()` (lines 118-121), which also fully reshuffles the deck/hand via `initState(deck.entries)`. There's no standalone "show all" control independent of a full reshuffle.

Also worth noting while scoping: "hidden" objectives aren't actually removed from the grid today — they render grayed-out/struck-through (lines 277-283) rather than disappearing. Confirm with the product owner whether that's the intended interaction (a toggle/mute) or whether hidden should mean visually removed — this affects what the eventual "reset visibility" UI should say/do.

## Acceptance Criteria

- [x] Add a control (e.g. a small "Show all objectives" button, visible only when `hiddenObjectives` is non-empty) that clears `hiddenObjectives` without calling `reset()`/reshuffling the hand.
- [x] `reset()`'s existing behavior (full reshuffle + implicitly clearing hidden state) is unchanged — this is additive, not a replacement.
- [x] Confirm/clarify the grayed-out-vs-removed visual treatment with the product owner if it's ambiguous whether that's intentional. — Not actually ambiguous: individual objectives are already re-shown by clicking them again (`toggleObjective` is bidirectional), so grayed-out/mute was already the intended interaction. The new "Show all" button is the bulk version of that same behavior, not a new mode.

## Resolution

Added a "Show all (N hidden)" button next to the "Current Objectives" header in `HandSimulator.tsx`, visible only when `hiddenObjectives` is non-empty. It calls a new `showAllObjectives()` callback that clears the `hiddenObjectives` set directly, independent of `reset()`.

## Files / Areas Touched

- `src/features/simulator/components/HandSimulator.tsx`

## Out of Scope

- Any other simulator behavior (draw logic, auto-discard, etc.) — untouched by this task.
