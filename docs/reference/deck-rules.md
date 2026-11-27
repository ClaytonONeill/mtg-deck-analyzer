# Deck rules

This page lists the deck-construction rules the app enforces for each format, the functions that implement them, and the places where each rule is and is not checked.

Every format rule lives in [`src/features/formats/formats.ts`](../../src/features/formats/formats.ts). The exceptions are the partner rules, which live in [`src/features/deckBuilder/utils/partnerUtils.ts`](../../src/features/deckBuilder/utils/partnerUtils.ts). [`src/store/deckStore.ts`](../../src/store/deckStore.ts) keeps thin wrappers (`isCardLegalForDeck`, `duplicateCardInDeck`, `isDuplicateCard`) for older callers.

For why the rules are built this way, see [Formats and legality](../explanation/formats-and-legality.md).

## Formats

A deck's format is `Deck.format`. A deck saved before formats existed has no `format` and is read as `commander` (`getFormat`).

| Format | `DeckFormat` | Main deck | Sideboard | Copies of a card | Commander | Color identity |
| --- | --- | --- | --- | --- | --- | --- |
| Commander | `commander` | Exactly 100, commander(s) included | None | 1 | Required | Enforced |
| Standard | `standard` | At least 60, no maximum | Up to 15 | 4 | None | Not enforced |
| Pioneer | `pioneer` | At least 60, no maximum | Up to 15 | 4 | None | Not enforced |
| Modern | `modern` | At least 60, no maximum | Up to 15 | 4 | None | Not enforced |
| Legacy | `legacy` | At least 60, no maximum | Up to 15 | 4 | None | Not enforced |
| Vintage | `vintage` | At least 60, no maximum | Up to 15 | 4, or 1 if restricted | None | Not enforced |
| Pauper | `pauper` | At least 60, no maximum | Up to 15 | 4 | None | Not enforced |

The table is `FORMATS`, in the order given by `FORMAT_ORDER`. Each `DeckFormat` value is also the card's Scryfall `legalities` key.

## Card legality

`cardLegality(card, format, live?)` returns `legal`, `restricted`, `banned`, or `not_legal`:

- Any card whose `type_line` contains the whole word `Basic` is `legal` in every format.
- Otherwise the value comes from `card.legalities[format]`. A value from `live` replaces the saved one when `live` has the card's id. Missing or unknown values count as `not_legal`.

A card can be played when it is `legal` or `restricted`.

### Saved vs. live legalities

Cards are saved whole, so each saved card holds the `legalities` Scryfall reported when the card was added. Ban lists change after that.

| Where | Legalities used |
| --- | --- |
| Deck builder decklist, deck detail page, gallery swap checks | Live, from `useCardLegalities()`. `CardPriceProvider` fetches them in the same `/cards/collection` requests as live prices, so they cost no extra calls. The saved values are used until the response arrives. |
| Builder card search add | The card returned by the search, which is current. |
| Home deck cards, import | Saved values only. |

## Copy limits

Copies are counted **by card name**, across the commander, partner, main deck, and sideboard together (`countByName`). A different printing counts as the same card.

`maxCopies(format, card, live?)` returns:

| Card | Limit |
| --- | --- |
| `type_line` contains `Basic` | Unlimited |
| Not playable in the format | 0 |
| `restricted` in the format | 1 |
| Oracle text contains `a deck can have any number of cards named` (case-insensitive) | Unlimited |
| Oracle text matches `a deck can have up to <number> cards named` | That number (for example 7 for Seven Dwarves, 9 for Nazgûl) |
| Anything else | The format's copy limit: 1 for Commander, 4 otherwise |

`isSingletonExempt(card)` is true for basic lands and for both oracle-text cases above.

## Adding a card: `checkCardAdd`

`checkCardAdd(deck, card, zone = "main", { live, ignoreSize })` returns `{ ok: true }` or `{ ok: false, kind, reason }`. It checks these in order and stops at the first failure:

| Order | `kind` | Fails when | `reason` |
| --- | --- | --- | --- |
| 1 | `illegal` | The card isn't playable in the deck's format. | "&lt;name&gt; is banned in &lt;format&gt;." or "&lt;name&gt; is not legal in &lt;format&gt;." |
| 2 | `color` | Commander only, once a commander is set: the card's color identity isn't within the deck's. | "&lt;name&gt; is outside your commander's color identity and cannot be added." |
| 3 | `copies` | One more copy would go over `maxCopies`. | "&lt;name&gt; is already in your deck." (limit 1), "&lt;name&gt; is restricted in Vintage: only one copy allowed.", or "&lt;format&gt; allows at most &lt;n&gt; copies of &lt;name&gt;." |
| 4 | `size` | Skipped with `ignoreSize`. Adding to the sideboard when it is at the format's maximum, or to the main deck when it is at the maximum (Commander: 100). | "The sideboard is full (15 cards).", "Commander decks don't use a sideboard.", or "The deck is full (100 cards)." |

`addCardToDeck` itself does not validate. Callers check `checkCardAdd` first.

### Where `checkCardAdd` is called

| Location | Zone | Options | Result on failure |
| --- | --- | --- | --- |
| Deck builder card search (`useDeckBuilder.addCard`) | The **Main deck** / **Sideboard** toggle | — | The card isn't added. An alert shows `reason`: red for `illegal`, blue for `copies`, amber otherwise. |
| Deck builder decklist **+** button (`DeckEntryList`) | The row's zone | Live legalities | The button is disabled and its tooltip shows `reason`. It is hidden on cards that can never have a second copy, such as Commander singletons. |
| Deck builder Basic Lands panel | Main | None (basics always pass) | The **+** buttons are disabled when the main deck is at its maximum (Commander: 100). |
| Gallery swap sidebar (`CardGallery` → `SwapSidebar`) | Main | `ignoreSize`, live legalities | The deck is checked with every pending swap applied and one copy of the outgoing card removed. A failure blocks selection. Search shows `reason` in a red alert, except `copies`, which is blue. Wishlist tiles show **IN DECK** for `copies`, and otherwise **ILLEGAL** with "Outside color identity" or "Not legal in this format". |
| Deck detail Suggestions **Add to deck** (`handleQuickAdd`) | Main | — | Nothing happens. Suggestions appear only for Commander decks. |

`duplicateCardInDeck(deck, card)` is `checkCardAdd` with `ignoreSize`, returning true only for a `copies` failure. The Suggestions tab uses it for "Already in deck".

## Search filtering

`useCardSearch(format)` adds a format filter to every Scryfall query:

| Search | Query suffix |
| --- | --- |
| Commander and partner pickers | `is:commander f:commander` |
| Builder card search, gallery swap search | `f:<format>`. Scryfall's `f:` matches both legal and restricted cards. |
| Wishlist add panel | None. The wishlist is shared by decks of every format, so legality is checked when a card is swapped into a deck. |

Search filtering is a convenience. `checkCardAdd` is the rule.

## Deck size

| Function | Returns |
| --- | --- |
| `getMainCount(deck)` / `getDeckCardCount(deck)` | The sum of `entries[].quantity`, plus 1 if a commander is set and 1 if a partner is set. The sideboard isn't counted. |
| `getSideboardCount(deck)` | The sum of `sideboard[].quantity`. |
| `mainTarget(deck)` | The format's minimum: 100 or 60. |
| `isMainComplete(deck)` | Commander: exactly 100. Other formats: 60 or more. |

Progress bars on Home (`DeckCard`), in the builder stats panel (`DeckStatsPanel`), and on the deck detail page show `count / mainTarget`. Constructed formats show the target as "60+" and also show the sideboard as "Sideboard n/15". There is no minimum to save: a deck can be saved at any size.

## Rule breaks in an existing deck

`getDeckViolations(deck, live?)` lists what breaks the deck's own format. Each entry has `cardName` (or `null` for a deck-level problem), `kind`, and `reason`:

| `kind` | Per card or deck | `reason` |
| --- | --- | --- |
| `illegal` | Card | "Banned in &lt;format&gt;" or "Not legal in &lt;format&gt;" |
| `color` | Card | "Outside the commander's color identity" (only once a commander is set) |
| `copies` | Card | "&lt;n&gt; copies; &lt;format&gt; allows &lt;limit&gt;" |
| `commander` | Deck | "No commander chosen" (Commander) |
| `size` | Deck | Sideboard over its maximum ("Commander decks don't use a sideboard" in Commander), or main deck over its maximum |

Short decks are not violations. The deck builder's decklist shows a red summary alert when the list isn't empty, and flags each card with a warning icon and its reason. In stacks view, the card gets a red ring and a reason badge.

## Legal in other formats: `getLegalFormats`

`getLegalFormats(deck, live?)` runs the violation check for every format and returns each one's `status`:

| `status` | Meaning |
| --- | --- |
| `illegal` | At least one violation in that format. `reasons` lists up to three cards that aren't legal there, plus any other violations. |
| `incomplete` | No violations, but the main deck is below that format's minimum (Commander: not exactly 100). |
| `legal` | No violations, and the size is right. |

A Commander deck is checked against the other formats with its commander and partner counted as main-deck cards. A deck without a commander is always `illegal` in Commander.

| Where | Shows |
| --- | --- |
| Home deck card (`LegalFormats`, compact) | "Also legal in" followed by the other formats that are `legal` (solid badge) or `incomplete` (outlined badge). Hidden for an empty deck. |
| Deck detail page, **Format legality** panel | Every format with its status and reasons. The deck's own format is highlighted. |

## Changing a deck's format

`changeDeckFormat(deck, format)` never removes a card:

- Commander → another format moves the commander and partner into the main deck.
- Another format → Commander leaves the commander slot empty and clears `colorIdentity`. The deck builder then shows the commander picker. The sideboard is kept and flagged (`size`); each sideboard row has a move-to-main button.
- Cards that break the new format's rules stay and are flagged by `getDeckViolations`. Switching back clears the flags.

In the builder, changing the format of a deck that has any cards opens a confirmation dialog that says how many cards will be flagged. The change is autosaved.

## Color identity

| Format | `deck.colorIdentity` |
| --- | --- |
| Commander | Set by `setCommander` (the commander's identity, and clears `partner`), `setPartner` (union with the partner's, in WUBRG order), and `removePartner` (the commander's, or `[]`). |
| Other formats | Derived by `withDerivedColors`: the union of every main-deck and sideboard card's `color_identity`, in WUBRG order. It's recalculated on every add, remove, move, format change, and import. |

In Commander, changing the commander or removing the partner leaves cards outside the new identity in the deck. Those cards are now flagged as `color` violations.

The Basic Lands panel lists only the basics within the commander's identity in Commander (after a commander is set), and all five basics in other formats.

## Partner commanders

`getPartnerInfo(card)` classifies a card's partner ability from its `oracle_text`:

| Type | Detection | `requiredPartnerName` |
| --- | --- | --- |
| `specific` | Oracle text matches `Partner with <Name>` (case-insensitive). Checked first. | The text after "Partner with", up to the first `(` or line break, trimmed. |
| `generic` | Oracle text contains the whole word `partner` (case-insensitive) and is not `specific`. | `null` |
| `none` | Neither of the above. | `null` |

Detection is a text match only. Any card whose oracle text contains the word "partner" is treated as `generic`. Two-commander mechanics that don't use the word "partner" (for example "Choose a Background") are classified as `none`.

`isValidPartner(commander, candidate)` returns `{ valid, reason }`:

| Commander type | Candidate | Result | `reason` |
| --- | --- | --- | --- |
| `none` | Any | Invalid | "&lt;commander&gt; does not have the Partner keyword." |
| `specific` | Name equals `requiredPartnerName` (case-insensitive) | Valid. The candidate does not need its own partner ability. | `null` |
| `specific` | Any other name | Invalid | "&lt;commander&gt; must partner with &lt;required name&gt;." |
| `generic` | Type `generic` or `specific` | Valid | `null` |
| `generic` | Type `none` | Invalid | "&lt;candidate&gt; does not have the Partner keyword and cannot pair with &lt;commander&gt;." |

The commander and partner pickers appear only for Commander decks. The partner search appears only when the commander's type is not `none`. `useDeckBuilder.setPartner` applies `isValidPartner` and shows `reason` as an error alert. Setting a new commander clears the partner. For the steps, see [Set up partner commanders](../how-to/set-up-partner-commanders.md).

## Import

`importDeckFromFile` checks:

1. The file parses as JSON.
2. `isValidDeck`: `id`, `name`, `createdAt`, and `updatedAt` are strings, and `entries` is an array.
3. After normalizing (a missing or unknown `format` becomes `commander`, a missing `sideboard` becomes `[]`, and entries without a card name are dropped), no card breaks its format's copy limit. Otherwise the import is rejected with "Invalid deck file — Commander decks can only contain one copy of: &lt;names&gt;." or "Invalid deck file — too many copies for &lt;format&gt; of: &lt;names&gt;."

Import does not reject banned cards, cards outside the color identity, partner problems, or size problems. Those import and are flagged. For the file structure, see [Deck file formats](deck-file-formats.md).

## Known gaps

- Version swaps work on the main deck only. Sideboard changes are made directly in the builder and aren't versioned.
- Home's "Also legal in" uses the legalities saved with each card when it was added, so it misses later bans. The deck detail page's **Format legality** panel uses live legalities.
- Partner selection doesn't check against the commander's own name, and partner detection is a word match on oracle text, not a keyword lookup.
- Commander variants (Brawl, Pauper Commander, Oathbreaker) and a companion slot aren't supported.
