# Multi-format decks (Commander + 60-card constructed)

Status: **implemented, awaiting the database migration and a manual test pass** (2026-11-27, branch `multi-format-support`, uncommitted). Estimate: **L, about 5–7 working days**, in 5 phases that can each be merged on their own. Tick the boxes as work lands so a later session can pick up where this one stopped.

## Context

The app only builds Commander decks. The rules are hard-coded in many places: singleton, a 100-card target, color identity, a required commander, and `format:commander` in search. The goal is to let a user pick a format per deck: **Commander, Standard, Pioneer, Modern, Legacy, Vintage, Pauper**. The app should then:

- enforce that format's legality and copy limits at every add path;
- support a **15-card sideboard** for constructed formats;
- show the format on the Home deck card, and let Home sort by format;
- show every format the deck is *also* legal in.

Product-owner decisions, made 2026-11-27:

- The sideboard is in v1.
- Pioneer is the only format added beyond the five requested.
- The Suggestions tab is hidden for non-Commander decks, because EDHREC only covers Commander.

**Key finding:** every `ScryfallCard` already stores Scryfall's `legalities` map (`legal | not_legal | restricted | banned` per format), persisted inside the deck JSON. That makes legality checks simple lookups, with no rarity or ban-list logic of our own. `applyVersionToDeck` (`src/features/deckVersions/utils/versionUtils.ts`) already handles quantities. Most of the work is replacing scattered Commander assumptions with one rules table.

**Database change required.** The product owner runs it, because the DB is off-limits per CLAUDE.md.

---

## Format rules (the single source of truth)

All rules live in a new pure, table-driven module, `src/features/formats/formats.ts`. A later format (Premodern, Historic, and so on) is then one table row.

| Format | Scryfall key | Main deck | Sideboard | Copy limit | Commander | Color identity |
|---|---|---|---|---|---|---|
| Commander | `commander` | exactly 100, including commander(s) | none | 1 | required | enforced |
| Standard / Pioneer / Modern / Legacy / Pauper | same as the name | ≥ 60, no max | ≤ 15 | 4, main + side combined | none | not enforced |
| Vintage | `vintage` | ≥ 60 | ≤ 15 | 4, or **1** for a `restricted` card | none | not enforced |

How the rules apply to each card:

- **Legality.** A card is legal when `card.legalities[key]` is `legal` or `restricted`. A `restricted` card caps at 1 copy.
- **Counting.** Copies are counted **by name**, across printings and across main + sideboard together.
- **Exemptions.** These extend the existing `isSingletonExempt` in `src/store/deckStore.ts`:
  - Basic lands (any `Basic` type line, including Snow-Covered basics and Wastes) are unlimited.
  - Cards with "any number of cards named" in their text are unlimited.
  - **New:** cards with "up to seven/nine cards named" (Seven Dwarves, Nazgûl) cap at the number parsed from that text.
- **Pauper.** Legality comes straight from Scryfall's `pauper` key, so the app needs no rarity logic.

Public API. Every function is pure, so tasks/009 can unit-test them once it lands.

| Function | Returns / does |
|---|---|
| `getFormat(deck)` | The deck's format. Decks without a `format` field read as `commander`, so old rows and imports keep working. |
| `checkCardAdd(deck, card, zone)` | `{ ok: true }` or `{ ok: false, reason }`. Combines legality, color identity (Commander only), copy limit, and deck/sideboard size. Its reason strings replace today's separate `colorWarning`/`duplicateWarning` copy. |
| `maxCopies(format, card)` | The copy cap for that card in that format. |
| `getDeckViolations(deck)` | A per-card list of problems: banned, too many copies, outside color identity, oversized sideboard. Used after a format switch or an import. |
| `getLegalFormats(deck, liveLegalities?)` | Per format: `legal`, `incomplete` (cards are fine but the deck is below minimum size), or `illegal` with reasons. Powers the "also legal in" indicator. |

`isCardLegalForDeck`, `duplicateCardInDeck`, `isDuplicateCard` and `findDuplicateCardNames` in `deckStore.ts` become thin wrappers over this module, or their callers move to `checkCardAdd`. This also moves rules out of `deckStore.ts`, which CLAUDE.md flags as "two things stapled together".

---

## Phase 1: Data model and migration (S)

- [x] In `src/types/index.ts`, add `export type DeckFormat = "commander" | "standard" | "pioneer" | "modern" | "legacy" | "vintage" | "pauper"`, and add `format: DeckFormat` and `sideboard: DeckEntry[]` to `Deck`.
- [x] In `src/store/deckStore.ts`, map `format` and `sideboard` in `getAll`, `getById` and `save`. When a column is null, read `format` as `"commander"` and `sideboard` as `[]`.
- [x] In `src/store/deckStore.ts`, change the signature to `createNewDeck(name, format = "commander")`.
- [x] Write `docs/plans/sql/multi-format-decks.sql` for the product owner to run:
  ```sql
  alter table decks add column format text not null default 'commander';
  alter table decks add column sideboard jsonb not null default '[]'::jsonb;
  ```
  The sideboard gets its own column on purpose, instead of a `zone` flag on each entry. Every existing consumer of `deck.entries` (metrics, simulator, gallery, versions, compare, recommendations) then stays mainboard-correct with no changes.
- [x] Give constructed decks a color identity derived from their cards: the union of each card's `color_identity`. A `recomputeColors(deck)` helper runs inside the add/remove helpers, so the stored `colorIdentity` stays meaningful. The Home color filter, color pips and `manaGradient` read it.
- [x] Extend each land's `legalities` in `BASIC_LANDS` (`src/features/deckBuilder/utils/basicLands.ts`) to every supported format. Today they say only `{ commander: "legal" }`, so without this the new check rejects basics.

## Phase 2: Rules engine and enforcement at every add path (M)

- [x] Build `src/features/formats/formats.ts` as specified above.
- [x] Route **every** way a card enters a deck through `checkCardAdd`. Search filtering alone isn't enough, because cards also arrive through Suggestions, the wishlist, swaps and imports. Each path:

| Done | Add path | File | Change |
|---|---|---|---|
| [x] | Builder search add | `src/features/deckBuilder/hooks/useDeckBuilder.ts` `addCard` | Call `checkCardAdd(deck, card, zone)`, with one `addWarning` state. Accept a `zone` argument. |
| [x] | Basic lands +/- | `src/features/deckBuilder/components/BasicLandsPanel.tsx` | In constructed formats, show all 5 basics instead of filtering by the commander's colors. Apply the size limit only in Commander. Also fix the `text-[10px]` header, which breaks the type-size rules. |
| [x] | Quantity +/- on entries | `src/features/deckBuilder/components/DeckEntryList.tsx` | **New:** a + control beside remove, gated by `checkCardAdd`. 4-of decks need it; today the only way to add a copy is to search again. |
| [x] | Suggestions quick add | `src/pages/DeckDetailPage.tsx` `handleQuickAdd` | Call `checkCardAdd`. The tab is hidden for non-Commander decks anyway. |
| [x] | Version swap-in / wishlist swap | `src/features/gallery/components/SwapSidebar.tsx`: `handleSelect`, and the per-row `legal` check near L538 | Call `checkCardAdd` on the deck with the version applied. Allow up to *quantity* pending swaps on the same `removeCardId`, so 2 of 4 copies can be swapped. |
| [x] | JSON import | `importDeckFromFile` in `deckStore.ts` | Replace the singleton-only `findDuplicateCardNames` check with `getDeckViolations`. Default a missing `format` to `commander`. Reject only structurally broken files; import a file with rule violations but flag them (Phase 3). Partly covers `tasks/021`. |

- [x] In `src/features/deckBuilder/hooks/useCardSearch.ts`, change `fetchCards` to take the format and query `f:${key}` instead of the hard-coded `format:commander`.
  - The commander picker keeps `is:commander f:commander`.
  - Scryfall's `f:` also matches restricted cards, which Vintage needs.
  - Leave the debounce and `AbortController` race-guarding as they are. This change adds no rate-limited calls.

## Phase 3: Builder UI, format picker and sideboard (M–L)

Files: `src/pages/DeckBuilderPage.tsx`, `DeckEntryList.tsx`, `DeckStatsPanel.tsx`, `CardSearchPanel.tsx`.

- [x] Add a format `select` next to "Deck Identity", listing all 7 formats.
  - On a new deck, the chosen format's rules apply immediately.
  - On a deck that already has cards, confirm the change in a modal styled like the shared `ConfirmDelete`, e.g. "Switch to Modern? 3 cards aren't legal there and will be flagged."
  - Cards are **flagged, not deleted**, so switching back undoes it.
  - Commander → constructed moves the commander and partner into the mainboard.
  - Constructed → Commander leaves the commander slot empty to pick.
  - The change goes through the existing autosave (`commitCards`), with no second `deckStore.save`.
- [x] Show the commander and partner pickers and the "The 99" label only when `format === "commander"`. Constructed decks show card search immediately; today it waits for `deck.commander`.
- [x] Add a Main / Sideboard toggle to card search for constructed formats, and pass the chosen zone to `addCard`.
- [x] Add a "Sideboard (n/15)" group below the main groups, with move-to-main and move-to-side actions.
- [x] Mark each card in `getDeckViolations` with an `error`-toned badge on its decklist row, with the reason in a tooltip.
- [x] Replace the hard-coded `cardCount >= 100` / `=== 100` checks with `format.mainSize` (exactly 100 for Commander, "60+" for constructed). They are in `DeckBuilderPage`, `DeckStatsPanel` (L90), `DeckCard` (L40, L113, L118) and `DeckDetailPage` (L375, L562, L571).
- [x] Make `getDeckCardCount` count the mainboard only, and add `getSideboardCount`.
- [x] Follow the CLAUDE.md type-size rules (`text-xs md:text-sm`, nothing below 12px), and check layouts at 375px, because the format select and zone toggle add a flex row.

## Phase 4: Home screen, legal-formats indicator and detail page (M)

- [x] `src/features/deckList/components/DeckCard.tsx`:
  - [x] Show a **format badge** (e.g. `Modern`) in the title row.
  - [x] Below it, show an **"Also legal in"** row of small badges from `getLegalFormats`: solid for legal, outlined for incomplete.
  - [x] Choose banner art for decks without a commander: the non-land card with the most copies (first one on a tie), falling back to the card-back image.
  - [x] Make the progress bar read `n/100` for Commander and `n/60` for constructed, plus a sideboard count.
- [x] Add a `"format"` sort to `DECK_SORTS` in `src/features/deckList/utils/deckLibrary.ts`. It groups decks by a fixed format order, then by most recently edited.
- [x] Add a format filter `select` beside the color chips in `src/pages/HomePage.tsx`. Persist it with `useLocalStorage`, like the sort.
- [x] Refresh legality on the builder and detail pages, because the stored `legalities` are snapshots from when each card was added and ban lists change.
  - `CardPriceProvider` (`src/context/CardPriceContext.tsx`) already fetches full card objects from `/cards/collection` but keeps only `prices`. Make it keep `legalities` too, and pass them to `getLegalFormats` and `getDeckViolations`. This adds no Scryfall calls.
  - Home keeps using the stored legalities, for the same reason `approxDeckValue` uses stored prices: fresh data would mean hundreds of lookups just to render Home.
- [x] `src/pages/DeckDetailPage.tsx`:
  - [x] Show the format, plus a legal-formats panel that gives a reason for each illegal format (e.g. "Banned: Ragavan").
  - [x] Hide the **Suggestions** tab when the format isn't Commander.
  - [x] Show the sideboard in the main view.
- [ ] Rename the "Cards in the 99" label to "Main deck cards" in `src/features/deckVersions/components/CompareStats.tsx` and `compareUtils.ts`. **Not applicable yet:** neither file exists on the `multi-format-support` branch. They come from commit `5325e5b` on another branch, so do this when that work merges.

## Phase 5: Remaining Commander assumptions, export and docs (S–M)

- [x] Check that `src/features/simulator/components/HandSimulator.tsx` works with no commander (`commander` and `partner` null): the command zone is empty and there's no commander tax. The library is the mainboard only.
- [x] Update the exports (`buildDeckTextExport` and `buildDeckXlsxBlob` in `deckStore.ts`):
  - The text export gets an Arena-style `Sideboard` section and drops the `Commander` header for constructed decks.
  - The xlsx export gets a `Sideboard` category.
  - The JSON export picks up `format` and `sideboard` with no change.
- [x] Keep version swaps mainboard-only in v1. Sideboard edits are made directly and aren't versioned. Note this in `docs/explanation/how-deck-versions-work.md`, and don't add version machinery (per tasks/007).
- [x] Update `docs/reference/data-model.md` with `Deck.format`, `Deck.sideboard`, the new columns, and the formats module API.
- [x] Add `docs/explanation/formats-and-legality.md` and link it from `docs/README.md`.
- [x] Update the user how-to for building a deck.
- [x] Fix the CLAUDE.md lines that say "Commander/EDH" and "up to 99 cards".

---

## Implementation notes (where the build differs from the plan above)

- **Import still rejects copy-limit breaks.** The plan said to reject only structural problems. That would have undone tasks/021, so a file that breaks its own format's copy limit is still rejected. Other rule breaks import and are flagged.
- **The wishlist search isn't format-filtered.** The wishlist is shared by decks of every format, so `WishlistAddPanel` searches every card (`format={null}`). Legality is checked when a wishlist card is swapped into a deck.
- **The swap sidebar's Suggested tab** is hidden for non-Commander decks, like the deck page's Suggestions tab.
- **Staple-role targets** in the builder's stats panel are Commander norms, so they are shown for Commander decks only. The land hint uses each format's range (Commander 33–40, otherwise 20–26).
- **The user how-to** is a new page, [`docs/how-to/build-a-60-card-deck.md`](../how-to/build-a-60-card-deck.md), rather than an edit to the Commander tutorial. `docs/reference/deck-rules.md` was rewritten to cover every format.
- **Basic lands are legal in every format** inside `cardLegality`, because the builder's hand-made basics have no real Scryfall legalities. `BASIC_LANDS` also lists every format as legal.

### Still open

- [ ] The product owner runs [`sql/multi-format-decks.sql`](sql/multi-format-decks.sql). **Until then every deck save fails**, because `deckStore.save` writes the new `format` and `sideboard` columns.
- [ ] Manual pass through the Verification list below, including phone width (375px). `npm run build` and `npm run lint` pass, and the rules engine was checked with a scratch script; the UI hasn't been run in a browser.
- [ ] tasks/021's open manual regression item, now for Commander and Modern.

## Out of scope (follow-up tasks)

- Suggestions for constructed formats (a Scryfall-only recommender).
- Commander variants (Brawl, Pauper Commander, Oathbreaker). Each needs its own commander rules.
- Other 60-card formats (Premodern, Historic, Timeless, Penny). Each is one table row plus a Scryfall key.
- A companion slot.
- Versioning the sideboard.
- A bulk "refresh card data" for stored legalities on Home.
- Notifications when a ban list changes.

## Risks and notes

- **Nothing new persists until the migration runs.** Decks can't save `format` or `sideboard` until the SQL is applied. Phases 2–3 can be built against the types first.
- **Home can lag a ban.** Deck pages refresh legality live; Home catches up only after a deck page is opened.
- **There's no test runner.** `formats.ts` is pure on purpose, so tasks/009 can cover it first. Until then, verify by hand (below).
- **This overlaps tasks/018 and tasks/021.** It closes part of 021 (the duplicate check on import and swap). Note that in both task files.

## Verification

1. Run `npm run build` and `npm run lint`, and confirm both are clean. The pre-commit hook enforces both.
2. Run `npm run dev` and check each case by hand:
   - **Modern deck:**
     - Search shows no banned cards.
     - Adding a 5th Lightning Bolt is blocked, with a reason.
     - 20 basics are allowed.
     - The sideboard stops at 15.
     - Main and side copies count together.
   - **Vintage:** a restricted card (e.g. Sol Ring) caps at 1.
   - **Pauper:** a card that isn't Pauper-legal is missing from search and is rejected through swap and wishlist.
   - **Commander deck:** behaves exactly as before (singleton, color identity, 100 cards, Suggestions tab).
   - **Existing saved decks:** load as Commander, unchanged.
   - **Format switch:** Commander → Modern flags violations without deleting anything, and switching back clears the flags.
   - **Home:**
     - The format badge shows.
     - "Also legal in" appears; e.g. a Pauper deck shows as legal in Modern, Legacy and Vintage when its cards allow.
     - Sorting by format groups decks correctly.
     - The format filter works.
   - **Import and export:**
     - An old JSON export without `format` still imports.
     - The text export includes a Sideboard section.
   - **Mobile:** check every changed screen at 375px.
