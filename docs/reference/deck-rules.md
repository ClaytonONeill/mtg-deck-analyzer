# Commander deck rules

This page lists the Commander deck-construction rules the app enforces, the functions that implement them, and the places where each rule is and is not checked.

All rule helpers live in [`src/store/deckStore.ts`](../../src/store/deckStore.ts), except the partner rules, which live in [`src/features/deckBuilder/utils/partnerUtils.ts`](../../src/features/deckBuilder/utils/partnerUtils.ts).

## Summary

| Rule | Function | Enforced on |
| --- | --- | --- |
| 100-card limit | `getDeckCardCount` | Builder card search, builder Basic Lands panel, Suggestions quick add |
| Color identity | `isCardLegalForDeck` | Builder add, Basic Lands panel (by filtering), version swap, Suggestions |
| Singleton | `isDuplicateCard`, `duplicateCardInDeck`, `findDuplicateCardNames` | Builder add, version swap, Suggestions, import |
| Singleton exemptions | `isSingletonExempt` | Every singleton check |
| Partner pairing | `getPartnerInfo`, `isValidPartner` | Builder partner selection |
| Commander eligibility | Scryfall query `is:commander format:commander` | Builder Commander and partner search |

## Card count

`getDeckCardCount(deck)` returns:

```text
sum of entries[].quantity + 1 (if commander is set) + 1 (if partner is set)
```

- The commander and partner each count as one card. A deck with a commander, a partner, and 98 entries counts as 100.
- A complete deck is exactly 100. The card-count progress bars on the deck list (`DeckCard`), the builder stats panel (`DeckStatsPanel`), and the deck detail page all use `cardCount === 100` as "complete".
- There is no minimum. A deck can be saved with any count.

### Where the limit applies

| Location | Behavior at 100 or more cards |
| --- | --- |
| Deck builder, "The 99" search (`DeckBuilderPage`) | The search input is disabled and its label reads "MAX CARD LIMIT REACHED". |
| Deck builder, Basic Lands panel | The `+` buttons are disabled. The `-` buttons stay enabled. |
| Deck detail page, Suggestions "Add to deck" | `handleQuickAdd` does nothing. The button is hidden unless the card is already in the deck. |
| Version swaps | No check. A swap removes one card and adds one, so it does not change the count. |
| Import | No check. An imported deck can have any count. |

## Color identity

`isCardLegalForDeck(colorIdentity, card)` returns `true` when every color in `card.color_identity` is in the deck's `colorIdentity`. Colorless cards (empty `color_identity`) are always legal.

### How the deck's color identity is set

| Function | Resulting `deck.colorIdentity` |
| --- | --- |
| `setCommander(deck, card)` | The commander's `color_identity`. Also clears `partner`. |
| `setPartner(deck, card)` | The union of the commander's and partner's color identities, in WUBRG order (`mergeColorIdentities`). |
| `removePartner(deck)` | The commander's `color_identity`, or `[]` if there is no commander. |

Changing the commander or removing the partner does not remove cards already in the deck. Entries outside the new color identity stay in the deck.

### Where the rule applies

| Location | Check | Result when the card is outside the identity |
| --- | --- | --- |
| Deck builder, "The 99" search (`useDeckBuilder.addCard`) | `isCardLegalForDeck` | Card is not added. Warning: "&lt;name&gt; is outside your commander's color identity and cannot be added." |
| Deck builder, Basic Lands panel | Filter, not a check | Only basic lands whose color is in the deck's identity are listed (Plains, Island, Swamp, Mountain, Forest). The panel appears only after a commander is set. It does not call `isCardLegalForDeck`. |
| Gallery swap sidebar (`SwapSidebar.handleSelect`) | `isCardLegalForDeck` | Card is not selected. Error: "&lt;name&gt; is outside this deck's color identity." |
| Deck detail page, Suggestions | `isCardLegalForDeck` | Suggestions exclude illegal cards (`useRecommendations`). `handleQuickAdd` also rejects them. |
| Import | None | Off-identity cards are imported as-is. |

## Singleton rule

A deck can hold only one copy of each card, by **card name**. A different printing (different Scryfall `id`) of a card already in the deck counts as a duplicate.

| Function | Behavior |
| --- | --- |
| `isDuplicateCard(existingCards, card)` | `false` if `card` is singleton-exempt. Otherwise `true` if any card in `existingCards` has the same `name`. |
| `duplicateCardInDeck(deck, card)` | `isDuplicateCard` against the commander, the partner, and every entry's card. |
| `findDuplicateCardNames(deck)` | Names of non-exempt cards that appear more than once across the commander, partner, and entries. An entry with `quantity` above 1 counts as more than once. Skips malformed entries that have no card name. |

### Singleton exemptions

`isSingletonExempt(card)` returns `true` when either of these holds:

- `type_line` contains the word `Basic` (case-sensitive, whole word). This covers basic lands, including snow basics.
- `oracle_text` contains `a deck can have any number of cards named` (case-insensitive). This covers cards such as Relentless Rats.

No other cards are exempt.

### Where the rule applies

| Location | Check | Result for a duplicate |
| --- | --- | --- |
| Deck builder, "The 99" search (`useDeckBuilder.addCard`) | `duplicateCardInDeck` | Card is not added. Message: "&lt;name&gt; is already in your deck." |
| Deck builder, Basic Lands panel | None | Calls `addCardToDeck` directly. Only basic lands are offered, which are exempt. |
| Gallery swap sidebar (`SwapSidebar.handleSelect`) | `isDuplicateCard` against commander, partner, current entries, and cards added by pending swaps (`CardGallery`'s `deckCards`) | Card is not selected. Error: "&lt;name&gt; is already in this deck." |
| Deck detail page, Suggestions | `duplicateCardInDeck` against the displayed version and the main deck (`isInDeck`) | Suggestions exclude duplicates. "Swap in" and "Add to deck" are disabled, and the button reads "Already in deck". |
| Import (`importDeckFromFile`) | `findDuplicateCardNames` | The whole import is rejected and nothing is saved. Error: "Invalid deck file — Commander decks can only contain one copy of: &lt;names&gt;." |
| Partner selection | None | `setPartner` does not check whether the partner duplicates the commander. |

`addCardToDeck` itself does not enforce singleton. Adding a card whose Scryfall `id` is already in `entries` increments that entry's `quantity`. Callers must check first.

## Partner commanders

`getPartnerInfo(card)` classifies a card's partner ability from its `oracle_text`:

| Type | Detection | `requiredPartnerName` |
| --- | --- | --- |
| `specific` | Oracle text matches `Partner with <Name>` (case-insensitive). Checked first. | The text after "Partner with", up to the first `(` or line break, trimmed. |
| `generic` | Oracle text contains the whole word `partner` (case-insensitive) and is not `specific`. | `null` |
| `none` | Neither of the above. | `null` |

Detection is a text match only. Any card whose oracle text contains the word "partner" is treated as `generic`. Other two-commander mechanics that don't use the word "partner" (for example "Choose a Background") are classified as `none`.

`isValidPartner(commander, candidate)` returns `{ valid, reason }`:

| Commander type | Candidate | Result | `reason` |
| --- | --- | --- | --- |
| `none` | Any | Invalid | "&lt;commander&gt; does not have the Partner keyword." |
| `specific` | Name equals `requiredPartnerName` (case-insensitive) | Valid. The candidate does not need its own partner ability. | `null` |
| `specific` | Any other name | Invalid | "&lt;commander&gt; must partner with &lt;required name&gt;." |
| `generic` | Type `generic` or `specific` | Valid | `null` |
| `generic` | Type `none` | Invalid | "&lt;candidate&gt; does not have the Partner keyword and cannot pair with &lt;commander&gt;." |

### Where the rule applies

- The deck builder shows the partner search only when the commander's type is not `none`. Its label is "Required Partner: &lt;name&gt;" for a `specific` commander and "Partner Commander" for a `generic` one.
- `useDeckBuilder.setPartner` calls `isValidPartner`. An invalid pick is not applied, and `reason` is shown as an error alert.
- `setPartner` does nothing if no commander is set.
- Setting a new commander clears the partner.
- Import does not check partner validity.

For the steps to add or remove a partner, see [Set up partner commanders](../how-to/set-up-partner-commanders.md).

## Commander eligibility

The app has no local check that a card can be a commander. The deck builder's "Commander" and partner searches add `is:commander format:commander` to the Scryfall query, so only cards Scryfall reports as commander-eligible appear. The "The 99" search adds `format:commander`, so only Commander-legal cards appear. Imported decks are not checked.

## Import

`importDeckFromFile` checks only:

1. The file parses as JSON.
2. `isValidDeck`: `id`, `name`, `createdAt`, and `updatedAt` are strings, and `entries` is an array.
3. `findDuplicateCardNames` returns no names (singleton rule above).

It does not check card count, color identity, partner validity, or commander eligibility. For the file structure, see [Deck file formats](deck-file-formats.md).

## Known gaps

- No rule is checked on import except singleton.
- Changing the commander, or removing the partner, leaves cards outside the new color identity in the deck.
- Partner selection does not check against the commander's own name.
- Partner detection is a word match on oracle text, not a keyword lookup.
- [tasks/021](../../tasks/021-enforce-duplicate-card-check-everywhere.md) added the singleton check to import and version swap. Its last item, a manual regression note for both paths, is still open.
