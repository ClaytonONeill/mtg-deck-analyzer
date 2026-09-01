# Simulator Playability Roadmap

**Status:** Planning  
**Related tasks:** [`019`](../../tasks/019-simulator-objectives-reset.md) (objectives UI polish), [`023`](../../tasks/023-objectives-semantic-clarity.md) (objectives modeling)

## Vision

Today's hand simulator is a **viewing tool**: draw a hand, inspect it, see objectives. To build genuine deck-testing and goldfishing capabilities, it needs to become a **playable tool**: cast spells, track board state, replay decisions, and collect stats over many hands. This document outlines the evolution from "draw and look" to "draw, cast, and learn."

## Current State

- `src/features/simulator/components/HandSimulator.tsx`: draws 7 random cards, shows card roles (mechanical objectives) and the deck's strategic objective(s) encountered
- Can shuffle and redraw; Phase 1 land-play/mana/casting is now implemented (see Phase 1 status below)
- Real turn structure exists (untap + draw via "Next Turn"), but no sub-phases (main/combat/end)
- Used for "does this hand look reasonable, and can I actually cast my curve?" checks
- Remaining limitation: no stats aggregation across multiple hands yet, and mana rocks/dorks aren't modeled — see Phase 1 status

## Phase 1: Minimal Playability (1–2 days)

**Status: partially landed.** Land play, mana tracking, and casting are in; stats collection ("Run 50 Hands") is not built yet.

**Goal:** Hand is castable; track land-play and basic sequencing.

### Changes
- **Game state:** Add `board` object tracking `{tapped, untapped, hand, graveyard, Library}`; track current mana (colored + generic), turn counter — **done**, as a single `permanentsInPlay`/`discard` (doubling as graveyard) on `SimState` in `HandSimulator.tsx`.
- **Land play:** Click a land card to play it; tracks mana availability. Auto-tap lands if only one way to pay. — **done**. One land per turn is enforced (`landPlayedThisTurn`).
- **Cast spell:** Click a non-land card to attempt cast. Validate mana cost; auto-tap if possible, else warn. Resolve to "on board" (for creatures) or "graveyard" (for most spells, until sorceries/instants have better handling). — **done**, via `src/features/simulator/utils/manaUtils.ts`.
- **Turn cycle:** "Next Turn" button resets mana, draws a card. Shows a simple turn counter. — **done**. The pre-existing "click the deck to draw" action still works too, but no longer advances the turn counter or untaps mana sources — it's now a separate "draw an extra card" action (e.g. for simulating draw spells), decoupled from turn-passing.
- **Mana rocks/dorks:** Sol Ring, Arcane Signet, Llanowar Elves, etc. all produce mana once cast — **done**. Mana dorks correctly respect summoning sickness (can't tap the turn they're cast, per rule 302.6); mana rocks/artifacts don't, since sickness only applies to creatures. Multi-mana sources (Sol Ring's 2, Mana Vault's 3) are modeled properly, not approximated as 1.
- **Command Zone:** Commander (and partner, if set) are visible and castable from a dedicated zone — **done**. Not part of the shuffled library/hand (matches real rules); includes a working commander-tax mechanic (+{2} generic per previous cast), though since nothing currently returns a permanent to the command zone (no death/bounce modeled), the tax can't actually trigger above {0} yet in practice — it's correct and ready for whenever removal exists, not dead weight kept "just in case." Same Gallery-tab visibility landed alongside this as [`tasks/016`](../../tasks/016-commander-in-gallery-view.md) (display-only pinned tiles, no swap/tagging).
- **Stats:** Over N hands (say, 50), track avg turn until first cast, avg lands per hand, avg mana available by turn 3/5/7, frequency of "castable in opening hand" — **not built yet.** Next slice of Phase 1.

### Known simplifications (mana engine)
Worth knowing about before relying on this for real deck testing — these are deliberate MVP shortcuts, not bugs. Verified against real card texts in a standalone script (Sol Ring, Mana Vault, Arcane Signet, Command Tower, Llanowar Elves, Birds of Paradise, Chrome Mox, Temple Garden, Fellwar Stone) — not committed to the repo since there's no test runner yet ([`tasks/009`](../../tasks/009-testing-foundation-unit-and-acceptance.md) owns standing that up).
- **Mana abilities are guessed from oracle text** (regex over `{T}: Add ...`), not a real rules parser. Conditional abilities ("if you control a Mountain...") get simplified to whatever colors they mention; sources with unrecognized text produce nothing.
- **Sources with an extra activation cost beyond `{T}` are excluded entirely** (Chrome Mox's sacrifice, cards that also cost life), rather than mis-modeled as free taps.
- **"Any color" abilities aren't scoped** — Command Tower (commander's color identity) and Fellwar Stone (colors opponents' lands could make) both simplify to "any of WUBRG," which is generous in a solo goldfishing context with no real opponents.
- **{X} spells aren't castable** — clicking one shows an explicit error rather than silently treating X as 0.
- **Hybrid/Phyrexian mana** (`{W/U}`, `{R/P}`) is simplified to its first listed color, not "either."
- **No combat** — creatures just sit on the battlefield once cast; there's nothing to attack with yet (that's Phase 3). Summoning sickness IS modeled, but only insofar as it gates mana abilities, not attacking (moot until combat exists).
- **First-turn draw isn't skipped** — every "Next Turn" draws a card, including turn 1, which slightly overcounts draws vs. real Commander turn order.

### Out of Scope
- Phases (main, combat, etc.)
- Instants / priority
- Creatures attacking/blocking
- Triggered/activated abilities
- Deck interaction (targets, tutors, etc.)

### UX Notes
- Simulator should stay **wizard-like** (linear flow, not real-time), not a full MTG Arena UI
- Clicking a card to cast it is OK; don't over-engineer interaction
- Stats appear as a summary panel after N hands, not real-time

---

## Phase 2: Deck Coherence Signals (est. 1–2 days after Phase 1)

**Goal:** Help see if deck actually achieves its strategic objectives.

### Changes
- **Objectives integration:** If deck has core strategic objectives (after [`023`](../../tasks/023-objectives-semantic-clarity.md) lands), show:
  - Which objectives are "active" by turn 5, 7, 10?
  - Which cards advance them; which are chaff?
  - Frequency: how often does "combo pieces" show up together?
- **Mulligan suggestions:** After hand is drawn, highlight cards to mulligan if they don't fit the gameplan (e.g., "no lands" or "three cards need 5+ mana, no ramp")
- **Synergy highlights:** Mark cards that work well together (e.g., Elf lords + elves, draw spells + wheels)

### Out of Scope
- Actually simulating synergies (that's Phase 3+)
- Opponent interaction
- Complex interactions (stack, priority)

---

## Phase 3+: Full Game Sim (TBD / lower priority)

**Goal:** Golfish against a basic opponent; see actual game progression.

### Possible scope
- Turn structure (phases, upkeep, main, combat, end)
- Creature combat (simple attacker/blocker assignment)
- Opponent AI (2-3 simple strategies: aggro, control, combo)
- Win condition detection
- Deck imports for opponent (optional)

### Why Phase 3+
- Much larger scope than Phase 1–2
- Clear value in Phase 1–2 already (mana analysis, coherence checks)
- Can gather user feedback on what's actually missing before overbuilding

---

## Data & UI Considerations

### Game State Shape (tentative, Phase 1)
```typescript
type SimulationState = {
  turn: number;
  hand: Card[];
  board: { tapped: Card[]; untapped: Card[] };
  graveyard: Card[];
  library: Card[];
  mana: { white: number; blue: number; black: number; red: number; green: number; generic: number };
  handHistory: { turn: number; hand: Card[]; drawn?: Card[]; cast: Card[] }[];
};
```

### Stats Collection (Phase 1)
```typescript
type SimStats = {
  hands: number; // 50 by default
  landDistribution: number[]; // [0-0, 1-2, 3+, ...]
  avgTurnsToFirstCast: number;
  avgManaByTurn: { turn: number; mana: number }[];
  handEvaluations: { turn: number; castable: number; other: number }[];
};
```

### UI Layout (Phase 1)
- **Top:** Deck name, turn counter, mana pool display
- **Left:** Library (face-down count), Hand (clickable cards)
- **Center:** Board (tapped / untapped creatures, other permanents)
- **Right:** Graveyard (small stack view)
- **Bottom:** "Play Land" / "Cast" / "Next Turn" / "Reset" / "Run 50 Hands" buttons
- **Stats panel:** Collapsible drawer showing Phase 1 stats after run

---

## Questions for Product Owner

1. **Focus:** Phase 1 (mana/sequencing testing) or straight to Phase 3 (real game sim)? The app is partly a dev exercise, but dev exercises are worthwhile if they land real value.
2. **Objectives integration:** Should Phase 1 assume [`023`](../../tasks/023-objectives-semantic-clarity.md) is done (with deck-level strategy defined), or should it work with today's flat objectives model?
3. **Opponent:** Is goldfishing (solo play) sufficient, or do you want to test against a simple AI? That's a Phase 3 scope bump but might be worth it if the goal is "test deck coherence vs. opponents."
4. **Board representation:** Is a text/card-stack view enough, or do you want a visual board state (portrait of creatures, tapped indicators, etc.)? Affects Phase 1 complexity.

---

## Relationship to Existing Work

- **Task 019** (`simulator-objectives-reset`): Narrow UI fix (show all objectives without reshuffle). Lands before Phase 1 or in parallel.
- **Task 023** (`objectives-semantic-clarity`): Determines whether Phase 2 has deck-level objectives to display. Should be decided before Phase 2 starts.
- **Task 018** (`shared-objectives-component`): Objectives assignment UI; independent of simulator work unless Phase 2 adds assignment inside the sim.

---

## Notes

- The simulator **doesn't need to be perfect** — it's a dev tool, not a replacement for real golfish. Accurate land mana-fixing, partial mulligan logic, and turn-by-turn stats are the MVP.
- Phases 2–3 can be evaluated against real user feedback from Phase 1. "Wow, I really wish I could see how often my combo pieces show up together" is a strong signal to prioritize Phase 2; "I'm just manually goldfishing against your bot instead" is a signal to reconsider.
- Consider instrumenting stats collection (e.g., log each simulation run) so you can compare deck changes over time without manual re-testing.
