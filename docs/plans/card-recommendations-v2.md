# Card Recommendations v2: commander-aware and deck-aware suggestions

> **For the agent reading this:** this is a self-contained brief. Read §1–§3 to understand the problem and the boundaries. §4 is the target architecture and §5 is the phased build. Each phase can be merged on its own. Before writing code, re-check the "Current system" facts against `src/features/recommendations/`, because this doc was written on 2026-11-03 against branch `card-rec` @ `9a8ae29`. Follow root `CLAUDE.md` (text-size rules, optimistic-update pattern, no ad hoc test tooling, database off-limits). No Supabase schema changes are needed for any phase.

## 1. The feature being asked for

Product owner's ask, restated: suggestions should be **meaningfully different per deck**. They should:

1. **Fit the commander's archetype.** This means what people actually build around *this* commander, not generic staples in its colors.
2. **Fit the cards the user has actually added.** This can be inferred from card names, types, rules text, and creature types, or from the user's **manual objective tags** on cards and on the deck.
3. **Keep the "tags shape the results" quality.** This is the app's edge over EDHREC: a user who tags a deck "Lifegain" or tags 6 cards "Blink" should see suggestions that lean that way, even when that isn't the commander's most popular build.
4. Keep everything the current feature already promises (see the memory and task 012). It stays version-aware. It works with no objectives at all, where objectives only boost. It has deck mode and swap mode ("for this card" / "for the deck"). Every card shows its reasons as chips. Pages of 8, max 3 "Show more".

## 2. The current system and why it falls short

Files: `src/features/recommendations/utils/deckSignals.ts` (plan building), `utils/scryfallRecs.ts` (fetch + merge + diversify), `hooks/useRecommendations.ts`, `components/RecommendationsPanel.tsx`, `components/RecommendationCard.tsx`, `src/features/objectives/utils/recognizedObjectives.ts` (preset objective labels).

How it works: regexes over the deck's oracle text, with commander text weighted ×3, detect up to 12 THEMES (counters, tokens, sacrifice, and so on), a tribe, and gaps in 4 ROLES (ramp/draw/removal/wipe, measured against fixed targets). Objective labels are mapped through `OBJECTIVE_SYNONYMS` to those same pattern ids and add weight. The top 4 signals each become one Scryfall query, of the form `(<oracle fragment>) id<=<colors> f:commander -t:basic`, sorted with `order=edhrec`. Results are merged with rank decay and then diversified.

Root causes of "the same core cards in every deck":

| # | Limitation | Effect |
|---|-----------|--------|
| L1 | Every query uses `order=edhrec`, which is EDHREC's **global** popularity rank and has nothing to do with the commander. | The top of `o:"draw a card" id<=UB` is the same list for every Dimir deck. |
| L2 | The commander only matters through 12 hand-written regex themes. | A commander whose plan isn't one of the 12 themes (e.g. "cast from exile", "goad", "energy", "+1/+1 on attack") gets role-gap staples only. |
| L3 | Role gaps (ramp/draw/removal/wipe) often win the top-4 signal slots. | The "fills a gap" staples crowd out synergy picks. |
| L4 | The signal is binary oracle-text matching. Nothing like "decks with this commander also play X" is used. | There's no co-play or archetype knowledge, so picks are hit or miss for the commander. |
| L5 | Tags only work when the label matches one of `OBJECTIVE_SYNONYMS`. Freeform tags do nothing. | Tagging feels unrewarded unless the user picks a preset. |
| L6 | Each signal returns at most 60 results, and only 4 signals run. | The candidate pool is shallow, so "Show more" quickly hits noise (hence the 3-click cap). |
| L7 | **Commander keywords are read as the commander's strategy.** THEME regexes run over the commander's whole oracle text, keyword line included, and get the ×3 commander bonus (`fromCommander` → +1 weight). Nothing separates evergreen keywords (lifelink, deathtouch, flying, …) from the ability that actually defines the deck, and some core archetypes (ETB / "enters" triggers, trigger doubling) have no THEME at all. | **Yarok, the Desecrated** ("Deathtouch, lifelink. If a permanent entering causes a triggered ability … to trigger, that ability triggers an additional time.") gets labeled "Commander synergy: Lifegain" and suggests lifegain cards. Its real archetype is ETB/landfall doubling. EDHREC's Yarok themes are Lands Matter 687, Landfall 482, ETB 378, Blink 367, Ramp 252, and Lifegain isn't in the top 10. |

What's worth keeping: the explained-reasons UX, version-aware `RecInput`, client-side exclusion/legality filtering (`isDuplicateCard`, `isCardLegalForDeck` from `src/store/deckStore.ts`), the session cache, request spacing, `diversify()`, and the theme/role/tribe detectors. The detectors become **re-rankers** in v2, not the main source of candidates.

## 3. Data source assessment

### 3a. `pyedhrec` (https://pypi.org/project/pyedhrec/): not recommended

| Check | Finding |
|---|---|
| Maturity | v0.0.2. Both releases and every commit are from **2024-02-03**, with nothing since. 14 GitHub stars. Apache-2.0. |
| How it gets data | It's an unofficial scraper. It fetches `edhrec.com` HTML, regexes the Next.js `__NEXT_DATA__` `buildId` out of it, then calls `edhrec.com/_next/data/{buildId}/commanders/{slug}.json`. When that fails, it falls back to a **hardcoded 2024 buildId**, which is almost certainly stale. Card details come from `json.edhrec.com/cards/{name}`. |
| Etiquette | It **rotates spoofed browser User-Agents** (`utils.py`). That pattern is meant to avoid detection, and we shouldn't copy it. |
| Fit | It's Python. Using it means hosting a server for an app whose architecture is "browser → Supabase + Scryfall, no custom server". |
| Verdict | It's a thin, unmaintained, fragile wrapper around data the browser can already fetch directly (see 3b). It's useful only as a map of which endpoints exist. Don't depend on it, and don't stand up a Python service for it. |

### 3b. EDHREC JSON directly (`json.edhrec.com`): **recommended**

Verified on 2026-11-03 with live requests:

- **Browser-callable.** The response carries `Access-Control-Allow-Origin: *`. It's served from S3 + CloudFront with `Cache-Control: public, max-age=1620`. No key or proxy is needed.
- Endpoints (all returned 200):
  - `/pages/commanders/{slug}.json`: the commander page.
  - `/pages/commanders/{slug}/{theme}.json`: the commander filtered to one theme, e.g. `atraxa-praetors-voice/infect`.
  - `/pages/commanders/{a}-{b}.json`: partner pairs, e.g. `thrasios-triton-hero-tymna-the-weaver`. The names appear to be in alphabetical order, which Phase 0 must verify.
  - `/pages/average-decks/{slug}.json`, `/pages/cards/{slug}.json`, `/pages/tags/{tag}.json`.
  - An unknown slug returns **403** (an S3 miss). Treat it as "no data", not as an error.
- Shape. Card lists live at `container.json_dict.cardlists[]`, with list tags `newcards, topcards, highliftcards (partners), creatures, instants, sorceries, utilityartifacts, enchantments, planeswalkers, utilitylands, manaartifacts, lands`. That's roughly 250–300 cards in total. Each `cardview` looks like `{ id, name, sanitized, synergy, lift, num_decks, potential_decks, trend_zscore }`.
  - **`id` is a Scryfall card id.** This was verified: Tekuthal's EDHREC id equals its Scryfall id. Candidates can therefore be hydrated in bulk through Scryfall `POST /cards/collection` (up to 75 ids per request).
  - Inclusion = `num_decks / potential_decks`. `synergy` is how much more often the card shows up with this commander than in other decks of its colors. This is the anti-staple signal that fixes L1/L4.
  - `tag_counts[]` = `[{ slug, value, count }]`, the commander's themes ranked by deck count (Atraxa: infect 3609, +1/+1 counters 2175, …). This is how deck tags and detected themes get mapped onto EDHREC's theme pages.
- Risks:
  - The endpoints are undocumented and unofficial. EDHREC publishes no API, and its shape could change.
  - `robots.txt` doesn't disallow `/pages`, and no ToS page was found at `/terms-of-service`. **The product owner should read EDHREC's terms before shipping.**
  - Mitigations: a single adapter module, defensive parsing, graceful fallback to the current engine, caching, low volume (a handful of users, about 1–3 requests per deck view), the normal browser User-Agent, and visible attribution with a link to the EDHREC page.

### 3c. Supporting sources

- **Scryfall `/cards/collection`** is already in the stack. It hydrates EDHREC ids into full `ScryfallCard`s, which provide oracle text for deck-fit scoring, images, and legality.
- **Commander Spellbook** (`backend.commanderspellbook.com`) is CORS-enabled (verified) and has an OpenAPI spec. Its `find-my-combos` endpoint takes a decklist and returns "almost included" combos, i.e. one-card completions. This is a strong **deck-specific** signal and fits Phase 3.
- **Scryfall Tagger `otag:`** gives richer function tags (e.g. `otag:ramp`, `otag:removal`). Today's code deliberately avoids it because tag renames would break silently. It's optional in Phase 2, behind a fallback to the oracle-text query.

### 3d. Architecture options considered

| Option | Verdict |
|---|---|
| Python service wrapping pyedhrec | Rejected (see 3a). It needs hosting, scrapes, and is unmaintained. |
| **Browser → `json.edhrec.com` directly** | **Chosen.** No new infrastructure, CORS is open, the data is CDN-cached, and it matches the app's no-server architecture. |
| Supabase Edge Function proxy with a cache table | Deferred. Build it only if EDHREC removes CORS, starts rate-limiting, or shared caching across users becomes worth it. It would be a drop-in replacement for the adapter's `fetch`. It needs explicit DB/infra sign-off per CLAUDE.md. |
| Our own co-occurrence model (ingest Moxfield/Archidekt decklists) | Out of scope. Overkill for a handful of users, and it carries its own ToS issues. |

## 4. Target architecture: hybrid "EDHREC pool, deck-aware re-rank"

```
RecInput (version-resolved deck, objectives)            ─┐
   │                                                     │
   ├─► edhrecClient.getCommanderPage(commander, partner) │  source A: commander archetype
   ├─► edhrecClient.getThemePage(slug, theme) ×≤2        │  source B: theme chosen from tags/detected themes
   ├─► existing Scryfall signal engine (deckSignals)     │  source C: tag/oracle-driven "unique" picks
   └─► (Phase 3) spellbook.almostCombos(deck)            │  source D: deck-specific combo pieces
                                                          ▼
             candidates by card name ──► hydrate missing via Scryfall /cards/collection
                                                          ▼
                  blend.score(candidate, deckProfile) ─► diversify() ─► exclude/legal filter ─► pages of 8
```

### 4a. Choosing the theme for source B

Use the commander page's `tag_counts`, and pick up to 2 theme slugs. Priority order:

1. Deck **strategy objectives** whose label fuzzy-matches a tag `value`/`slug` (normalized: lowercase, `+1/+1` → `plus-1-plus-1`, non-alphanumerics → `-`). Fuzzy matching is what makes freeform tags matter (fixes L5).
2. Card-level objectives tagged on ≥3 cards, using the same matching. This mirrors the existing `objectiveLabels()` threshold.
3. Detected THEMES/tribe, mapped through a small `PATTERN_TO_EDHREC_TAGS` table (e.g. `counters → plus-1-plus-1-counters`, `tokens → tokens`, `blink → blink|flicker`, `tribe-Elf → elves`). Only use a match if it appears in this commander's `tag_counts`.

4. If there's no user tag, use **deck resemblance**. Fetch the theme pages for this commander's top 4 `tag_counts` (cached), and pick the theme whose card list overlaps most with the cards already in the user's 99. This answers "which EDHREC build does *this* deck look like?" A Yarok deck full of ETB creatures picks ETB/Blink, while a Yarok deck full of fetch lands picks Landfall. This is how the deck's own cards steer the archetype, not just the commander.

If nothing matches, skip source B.

### 4a′. Commander intent: more than its keywords (fixes L7)

The commander's archetype is decided by **evidence about how it's played**, not by which words appear on it. In priority order:

1. **EDHREC first.** When commander data exists, the commander's themes *are* its `tag_counts`, normalized to shares. The candidates' `synergy` already encodes what the commander actually does. For Yarok, the top synergy cards are Coiling Oracle 58%, Panharmonicon 58%, Mulldrifter 54%, Lotus Cobra 53%, and Ghostly Flicker 48%, with no lifelink cards in sight. In this case the regex "Commander synergy" signals in `buildDeckPlan` are **disabled for the commander**. They still run on the 99 for `deckFit`.
2. **Keyword-aware text parsing (fallback, and for `deckFit`).** Before running THEME regexes on a commander, remove keyword-only lines. A line made up entirely of entries from Scryfall's `card.keywords` array (e.g. `Deathtouch, lifelink`) is dropped. Keywords then count as a weak signal (×0.25), not with the ×3 commander bonus. The check is mechanical: the line, split on `,`, is a subset of `keywords` (case-insensitive). No hardcoded keyword list is needed.
3. **Add the missing rules-text archetypes** to `THEMES`. Each should have a regex for detection, a Scryfall query, and a `PATTERN_TO_EDHREC_TAGS` mapping:
   - `etb`: `/when(ever)? [^.]*enters/`, plus trigger-doubling text such as `/triggers? an additional time/`. Query `(o:"enters" (o:"when" or o:"whenever"))`. EDHREC tags `etb`, `blink`.
   - Phase 0 should list further commander archetypes the 12 THEMES miss (e.g. cast-from-exile, attack triggers, goad, energy, storm, wheels) and add only those that show up in the users' actual decks.
4. **Deck-evidence check.** A commander-derived regex theme the 99 doesn't support (fewer than 3 matching cards) and that isn't in EDHREC's top `tag_counts` is demoted to weight 0.25. It still gets a chip if a card happens to match, but it can't take a top signal slot.

Net effect for Yarok: suggestions come from its ETB/landfall-heavy EDHREC pool. They're re-ranked toward ETB or landfall, depending on which one the user's 99 resembles. A user who *does* tag the deck "Lifegain" still gets lifegain picks, because user tags can override (rule 1 of §4a). That's the "tags give a unique presence" property.

### 4b. Scoring (pure function, `utils/blend.ts`)

For each candidate (named constants, tuned in Phase 1):

```
score =  W_SYN   * clamp(synergy, -0.2, 0.6)/0.6        // commander-specific fit (A/B)
       + W_INC   * inclusion                             // small: popularity, not dominance
       + W_THEME * (in theme page B ? themeInclusion : 0)
       + W_FIT   * deckFit(card)                         // shares deck's detected themes / tribe
       + W_TAG   * tagFit(card)                          // matches a user objective's pattern (existing OBJECTIVE_SYNONYMS + 4a matches)
       + W_GAP   * roleGapFill(card)                     // capped so staples can't dominate (fixes L3)
       + W_SRC   * (number of sources agreeing - 1)
       + scryfallSignalScore(card)                       // source C's existing rank-decay score, normalized
```

- `deckFit`/`tagFit`/`roleGapFill` reuse `deckSignals.ts` detectors. Export a `cardPatternIds(card)` helper that runs THEMES/ROLES over `cardText(card)`, next to the existing `cardRoles`, `primaryType`, and `cardText`.
- **"Hidden gems" mode** (a toggle in the panel): multiply by `(1 - inclusion)^k`, so high-synergy, low-inclusion cards rise. This is the direct fix for "the same core set".
- Reasons chips, generated per contributing term. Examples: `EDHREC: in 62% of Atraxa decks`, `+27% synergy`, `Infect theme`, `Fits your "Lifegain" tag`, `Fills ramp gap (6/10)`, `Completes combo with X` (Phase 3).

### 4c. Swap mode

Use the same candidate pool, then apply `buildSwapPlan`'s constraints (primary type, cmc ±1, shared role/objective) as **client-side filters and boosts** over the hydrated pool, instead of only as Scryfall query fragments. Keep source C's swap queries as the supplement and as the fallback.

### 4d. Failure and fallback

- EDHREC returns 403, 404, a network error, or a parse failure → run source C only (today's behavior) and show a small note: "No EDHREC data for this commander; suggestions are based on your deck's cards and tags."
- No commander selected yet → source C only.
- Hydration fails → drop those candidates. Don't fail the whole panel.

### 4e. Caching and rate limits

- A session `Map` keyed by EDHREC URL, sitting next to the existing plan cache.
- Optional: `localStorage` with a 24h TTL for commander pages. This is a per-viewer convenience and must be wrapped in try/catch, per CLAUDE.md norms.
- Reuse `REQUEST_SPACING_MS` for Scryfall collection calls. Make at most 1 commander request + 4 theme requests (deck resemblance, cached per commander) + ⌈candidates/75⌉ collection requests per plan. Only hydrate cards not already present in source C results.

## 5. Phased implementation

### Phase 0: spike (XS, no UI)
- [ ] Write `toEdhrecSlug(card)` and verify it against roughly 10 commanders. Cover punctuation (`Atraxa, Praetors' Voice`), DFC/MDFC front faces, partners (confirm alphabetical order, and try the reverse order on 403), "Choose a Background" pairs, Friends Forever, and a brand-new commander (expect 403).
- [ ] Confirm EDHREC `cardview.id` → Scryfall `/cards/collection` hydrates for every list, including lands.
- [ ] Record the findings at the bottom of this doc.

### Phase 1: EDHREC source + blended ranking, deck mode (M)
- New `src/features/recommendations/utils/edhrecClient.ts`: slug builder, `getCommanderPage`, `getThemePage`, parsing into a typed `EdhrecCandidate { scryfallId, name, synergy, inclusion, numDecks, list }`, the cache, and 403 handling. **Only this file knows EDHREC's JSON shape.**
- New `utils/scryfallCollection.ts` (or an addition to `scryfallRecs.ts`): `hydrateByIds(ids, signal)`, chunked by 75 and spaced.
- New `utils/blend.ts`: `scoreCandidates(sources, input) → Recommendation[]`. This is a pure function, so it's a good first unit-test target once `tasks/009` lands.
- `deckSignals.ts`: export `cardPatternIds`. Apply §4a′ items 1–4: strip keyword-only lines from the commander, weight keywords at ×0.25, add the `etb` theme, skip regex commander-synergy signals when EDHREC data is present, and add the deck-evidence demotion. (Items 2–4 also improve the fallback path when EDHREC has no data.)
- `useRecommendations.ts`: orchestrate A + C in parallel (they hit different hosts), then blend and diversify. Keep the existing return shape, so `RecommendationsPanel` and the swap sidebar keep working. `Recommendation` gains an optional `source`/`edhrec` field.
- `RecommendationsPanel.tsx`: the "Based on" line names the commander, and add "Data: EDHREC" with a link to `https://edhrec.com/commanders/{slug}`. `RecommendationCard.tsx`: reason chips as above, following the `text-xs md:text-sm` rule.
- Revisit `MAX_MORE_CLICKS` (the pool is now ~300 deep). Keep the cap unless the product owner says otherwise.

### Phase 2: tags → theme pages, swap mode, hidden gems (M)
- Implement §4a theme selection and source B, including deck-resemblance theme picking (§4a item 4), along with the `PATTERN_TO_EDHREC_TAGS` table.
- Implement §4c swap-mode filtering over the blended pool.
- Add a "Top picks / Hidden gems" toggle (per-viewer `localStorage` is fine).
- Optional: `otag:` queries in source C with an oracle-text fallback.

### Phase 3: deck-specific combos and infra hardening (S–M, optional)
- `utils/spellbookClient.ts`: POST the deck to `find-my-combos`, and turn "almost included" results into candidates with reason `Completes combo: A + B`.
- Do this only if needed: a Supabase Edge Function proxy/cache for EDHREC (needs product-owner + DB sign-off).

### Out of scope
- A Python or custom backend, scraping HTML, rotating User-Agents.
- ML or embeddings, or an LLM in the recommendation loop.
- Token suggestions (`all_parts`). These stay in task 012 as a separate slice.
- Shared objectives UI consolidation (task 018, deferred). Read objectives via `RecInput` and don't add a new tagging surface.
- Any Supabase schema or RLS change.

## 6. Open questions for the product owner
1. Has EDHREC's terms been reviewed and accepted for low-volume, attributed use of `json.edhrec.com`? (This blocks shipping, not building.)
2. Default mode: "Top picks" or "Hidden gems"? Should the toggle be shown at all?
3. Should lands (`utilitylands`, `lands`) be suggested, or excluded as today (`-t:basic` only excludes basics)?
4. Should budget be considered? EDHREC has `/budget` and `/expensive` variants of its pages.
5. Should tag influence be adjustable by the user (e.g. a "lean on my tags" slider), or stay fixed weights?

## 7. Verification
- `npm run lint` and `npm run build` pass. The pre-commit hook enforces lint-staged with eslint `--max-warnings=0` and `tsc`.
- `npm run dev`, then check on the deck page's Suggestions tab and the Gallery swap sidebar's "Suggested" tab:
  - **Popular commander** (Atraxa): suggestions show EDHREC reasons, and the first page isn't just color staples.
  - **Keywords aren't the strategy** (Yarok, the Desecrated, the product owner's real deck): "Based on" has no Lifegain signal. The first page is mostly ETB/landfall cards (expect cards like Coiling Oracle, Panharmonicon, Mulldrifter). No card appears only because it has lifelink. Repeat with EDHREC disabled (e.g. block `json.edhrec.com` in DevTools): the fallback should show an ETB signal, not Lifegain. Then add a "Lifegain" strategy objective and confirm lifegain picks *do* appear, because the tag override works.
  - **Distinctness:** two decks in the same colors with different commanders should have a top-16 overlap of ≤4 cards. Note today's overlap first as a baseline.
  - **Tags matter:** add a strategy objective that matches a `tag_counts` theme (e.g. "Infect" on Atraxa). Theme-page cards should rise, with a "theme" chip.
  - **Freeform tag:** an objective label that isn't in `recognizedObjectives` still changes results when it matches an EDHREC theme.
  - **Partner pair** (Thrasios + Tymna) resolves. A **brand-new/unknown commander** falls back gracefully, with a note and no error state.
  - **Swap mode:** replacements keep type/cmc constraints.
  - **Versions:** switching deck versions changes suggestions. Pending swaps stay excluded.
  - In the DevTools Network tab: about 1–3 EDHREC requests per deck, no repeat requests when switching tabs, and Scryfall calls spaced.
- Unit tests for `toEdhrecSlug` and `blend.scoreCandidates` once `tasks/009` provides a runner. Don't add ad hoc tooling.
