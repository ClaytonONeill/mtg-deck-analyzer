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

- [ ] **Get product-owner input on which model makes sense** — this is a design question, not an engineering one. Confirm which direction before any code lands.
- [ ] **Document the chosen model** in this file's "Decision" section below, including rationale.
- [ ] If Option A or C: **Data shape**: Confirm how deck-level objectives are stored/queried (new deck table column? separate metadata object?). No migration needed; just clarify the structure.
- [ ] If Option A or C: **UI changes** — sketch out how the two levels show up in the deck builder, gallery, simulator, and deck comparison. This feeds into [`018`](018-shared-objectives-assignment-component.md)'s component consolidation.
- [ ] **Coordinate with simulator work** — ensure the simulator's "show objectives encountered" feature is clear about whether it's showing strategy-level or mechanic-level tags.

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

(To be filled in after product-owner input.)

**Chosen model:** 

**Rationale:** 

**Implementation approach:** 

