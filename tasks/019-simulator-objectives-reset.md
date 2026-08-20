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

- [ ] Add a control (e.g. a small "Show all objectives" button, visible only when `hiddenObjectives` is non-empty) that clears `hiddenObjectives` without calling `reset()`/reshuffling the hand.
- [ ] `reset()`'s existing behavior (full reshuffle + implicitly clearing hidden state) is unchanged — this is additive, not a replacement.
- [ ] Confirm/clarify the grayed-out-vs-removed visual treatment with the product owner if it's ambiguous whether that's intentional.

## Files / Areas Touched

- `src/features/simulator/components/HandSimulator.tsx`

## Out of Scope

- Any other simulator behavior (draw logic, auto-discard, etc.) — untouched by this task.
