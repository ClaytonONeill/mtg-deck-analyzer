# 012 — Card/token suggestions for a deck

**Labels:** `feature`, `area:deck-builder`, `priority:low`, `needs-product-input`
**Estimate:** L
**Depends on:** none

## Summary

`IDEAS.md` asks for the app to auto-suggest cards (and relevant token cards) that pair well with a deck, based on the text/rules descriptions of cards already in it. Confirmed unbuilt — there is no "suggest," keyword-extraction, or recommendation logic anywhere in `src/`, and no existing groundwork to build on.

## Background

This is the least-scoped item in `IDEAS.md` — it's a real feature design problem, not a bug or a small gap. Before writing code, the product half needs deciding:

- **Suggestion source**: Scryfall search (`api.scryfall.com`) supports full-text and Oracle-text queries, so card suggestions could plausibly be built from Scryfall queries derived from the deck's color identity + a few heuristics (e.g. tribal type overlap, keyword overlap) without needing any external ML/recommendation service — but "based on the text descriptions of the cards you have added" as literally stated implies some text-similarity matching, which is a meaningfully bigger scope (embeddings, an LLM call, or a hand-rolled keyword heuristic) than a plain Scryfall query.
- **Token suggestion**: Scryfall's `all_parts` field on a card response lists related token objects it creates — this is likely the more tractable half of this ask and could ship as its own smaller slice ("show token cards this deck's cards create") independent of the harder card-recommendation half.
- **Where it lives in the UI**: a new tab/panel on `DeckDetailPage`? Inline in `CardGallery`? Get product-owner input before building UI.

## Acceptance Criteria

- [ ] **Get product-owner sign-off on scope before building anything** — at minimum, decide whether this ships as two separable slices (token suggestions via `all_parts`, then card suggestions later) or one combined feature.
- [ ] If token suggestions ship first: for each card in the deck, surface any tokens it creates (via Scryfall's `all_parts`, filtered to `component === "token"`), deduplicated across the deck.
- [ ] If card suggestions ship: define and document the actual heuristic used (don't ship an unexplained black-box recommendation with no rationale visible to the user).
- [ ] No caching/rate-limit handling exists for Scryfall today (see `CLAUDE.md`'s Scryfall integration section) — a suggestion feature will likely issue many more Scryfall calls than the app does today, so add basic caching/backoff as part of this work rather than hammering the API unthrottled.

## Files / Areas Touched

- Likely new: `src/features/suggestions/` (hooks + components)
- `src/pages/DeckDetailPage.tsx` or `src/features/gallery/components/CardGallery.tsx` (surface point, TBD with product owner)

## Out of Scope

- Any specific ML/embedding infrastructure unless explicitly approved — default to the simplest heuristic that satisfies the product owner's actual ask.
- General Scryfall caching/rate-limiting as an app-wide concern beyond what this feature needs (a broader fix, if wanted, is a separate task).
