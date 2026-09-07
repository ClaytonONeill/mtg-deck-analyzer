# 023 — Clarify deck-level strategy vs. card-level roles in objectives model

**Labels:** `design`, `area:objectives`, `priority:medium`, `needs-product-input`
**Estimate:** M
**Depends on:** none, but coordinates with [`018`](018-shared-objectives-assignment-component.md) (shared component consolidation) — decide model first, then build the UI.

## Summary

`IDEAS.md`: The objectives system currently conflates **deck-level strategic objectives** (1–2 core win conditions or themes, e.g., "Combo Win", "Creature Beatdown") with **card-level roles/qualities** (mechanical tags like "Ramp", "Removal", "Card Draw"). This makes it impossible to reason about whether all cards in a deck actually support its core strategy, and obscures what's a genuine objective vs. a useful mechanical property. The fix is a semantic/modeling clarification, not a backend rebuild — the data can stay; the interpretation changes.

## Background

Today, a user tags cards with objectives like:
- "Ramp" (mechanical role: reduces spell cost / acceleration)
- "Combo Win" (strategic: this card is part of the wincon)
- "Removal" (mechanical role: answers threats)
- "Card Draw" (mechanical role: advantage generation)

This means:
- A deck objective can't cleanly ask, "Are 80% of my cards pulling toward my win strategy?"
- Unclear whether "Ramp" is a valid deck objective or just a common card quality
- The simulator's "show objectives encountered" feature works OK mechanically but doesn't distinguish between "show me my strategic themes" and "show me card roles I'm playing"
- Hand simulation and deck-comparison decisions are harder because there's no distinction between strategy-level and mechanic-level tags

## Proposed Model (for product-owner input)

**Option A: Two-tier (per-deck + per-card)**
- Deck has 1–2 **strategic objectives** set once at creation (e.g., "Infinite Mana Combo", "Creature Aggression")
- Each card tagged with one or more **mechanical roles** (e.g., "Ramp", "Threat", "Tutors", "Interaction")
- UI shows both; deck-coherence checks ask, "Do the mechanical roles of my cards ladder up to my strategic objectives?"

**Option B: Strict objectives-only (discipline in tagging)**
- Keep the current data model but enforce stricter tagging: only tag cards with real strategic objectives, not mechanical roles
- Use separate mechanisms (maybe card-filtering by type/keyword, or manual checklists) to track mechanical roles
- Simpler to implement but requires user discipline and loses some utility (can't currently filter/search by "all ramp cards")

**Option C: Hybrid (deck objectives + optional mechanical taxonomy)**
- Deck has core strategic objectives
- Cards also get tagged with objectives, but those objectives are constrained to a predefined taxonomy (e.g., only "Ramp", "Draw", "Removal", "Threat", "Setup" allowed)
- Balances structure with flexibility

## Acceptance Criteria

- [x] **Get product-owner input on which model makes sense** — this is a design question, not an engineering one. Confirm which direction before any code lands.
- [x] **Document the chosen model** in this file's "Decision" section below, including rationale.
- [x] If Option A or C: **Data shape**: Confirm how deck-level objectives are stored/queried (new deck table column? separate metadata object?). No migration needed; just clarify the structure.
- [x] If Option A or C: **UI changes** — sketch out how the two levels show up in the deck builder, gallery, simulator, and deck comparison. This feeds into [`018`](018-shared-objectives-assignment-component.md)'s component consolidation.
- [x] **Coordinate with simulator work** — ensure the simulator's "show objectives encountered" feature is clear about whether it's showing strategy-level or mechanic-level tags.

## Files / Areas Touched

No files changed until model is decided. Potential scope after decision:
- `src/store/deckStore.ts` (data access, if deck-level objectives need a new property)
- `src/hooks/useDeckBuilder.ts` (deck creation/init)
- `src/features/gallery/components/CardGallery.tsx` (card objective assignment)
- `src/features/simulator/components/HandSimulator.tsx` (objective display)
- `src/pages/DeckDetailPage.tsx` (deck view / comparison)

## Out of Scope

- Changing the `objectives` table schema without product-owner sign-off
- Building out the shared component [`018`](018-shared-objectives-assignment-component.md) until this model is locked in
- Retrofitting existing user data to a new model (if it would require a migration, defer that conversation; this task just locks the design)

## Decision

**Chosen model:** Option A (two-tier: deck-level strategic objectives + card-level mechanical roles), with one amendment to the original proposal — the product owner wants strategic objectives to stay editable for the life of the deck, not locked in at creation. Confirmed this doesn't create a design conflict: it's just a normal editable field, same as a deck's name.

**Rationale:** Card-level mechanical-role tagging already exists and works (`DeckEntry.objectiveIds`); the missing half was a place to declare the deck's actual strategic goal(s) so they can eventually be checked against the mechanical roles in play. Reusing the existing `Objective` type/table for both levels (rather than a separate taxonomy) avoids the schema/table-proliferation Option C would need, while still giving Option A's separation of concerns — a strategic objective and a mechanical role are just `Objective`s used in two different slots (`Deck.objectives` vs. `DeckEntry.objectiveIds`), not two different data models.

**Data shape:** No migration. `decks.objectives` (jsonb) already existed in the DB and in `Deck.objectives: Objective[]` — it was dead code (nothing read or wrote it). Repurposed it in place to mean "deck-level strategic objectives." Added `addStrategicObjective`/`removeStrategicObjective` pure helpers in `deckStore.ts` alongside the existing `setCommander`/`setPartner` pattern. Field is documented at the type ([`types/index.ts`](../src/types/index.ts)) to make the distinction from `objectiveIds` explicit for future readers.

**Version snapshotting:** Per product-owner call, versions do **not** snapshot the strategic objective — they always reflect the deck's current value. So `DeckVersion` needed no changes, and there's nothing version-specific to show in `VersionCompare` (a deck has exactly one current strategic-objective set, shared across all its versions) — left untouched rather than adding a comparison that has nothing to compare.

**Objective cap:** Soft-guided (1–2), not hard-enforced — an italic hint appears in the assignment dropdown once 2 are already set, but a 3rd can still be added.

**UI changes implemented:**
- `DeckDetailPage.tsx`: new "Strategy" row in the deck identity block — assigned objectives as removable pills, a `+` dropdown to assign more (same interaction pattern as the existing card-level assignment dropdown in `CardGallery.tsx`), optimistic update + rollback matching `useDeckVersions.appendToVersion`'s pattern.
- `HandSimulator.tsx`: top bar now shows "Deck Strategy" pills (reads `deck.objectives` directly, no new prop needed) for context alongside the turn counter; the encountered-objectives panel below was retitled from "Current Objectives" to "Card Roles Encountered" so it's unambiguous that panel is mechanical-role tracking, not the deck's strategy.
- Deck builder (creation flow) was deliberately **not** touched — since the objective is meant to be editable for the deck's whole life rather than fixed at creation, there's no need to duplicate the assignment UI into the creation wizard; `DeckDetailPage` already covers "set it right after creating the deck."
- Gallery (`CardGallery.tsx`) was **not** changed — card-level tagging there was already correct (mechanical roles) and needed no reinterpretation.

**Implementation approach:** Straight to code, no separate sketch-then-build step — the change was small enough (repurpose an existing dead field + one new UI affordance + one panel relabel) that a design doc would have cost more than it saved.

