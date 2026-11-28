# Formats and legality

The app started as a Commander-only builder. It now builds decks for Commander, Standard, Pioneer, Modern, Legacy, Vintage, and Pauper. This page explains how it decides what is legal, and why the rules are built the way they are. The exact rules and messages are in [Deck rules](../reference/deck-rules.md).

## Scryfall already knows the ban lists

Every card the app saves is Scryfall's full card object, and every card object carries a `legalities` map: `legal`, `restricted`, `banned`, or `not_legal`, for every format. So "is this card legal in Modern?" is a lookup, not logic the app owns. The app has no copy of any ban list, no Vintage restricted list, and no Pauper rarity check. Pauper legality, which depends on whether a card was ever printed at common, is also Scryfall's answer.

What the app does own is the deck-level rule set for each format: how many cards, how many copies, whether there is a sideboard or a commander, and whether color identity applies. Those are one row each in a table (`FORMATS` in `src/features/formats/formats.ts`). The other 60-card formats share one definition, so adding another one like Premodern is a single row plus its Scryfall key.

## One check at every door

Cards get into a deck in several ways: the builder search, the **+** on a decklist row, the Basic Lands panel, a gallery swap from search or the wishlist, a Suggestions quick-add, and import. Filtering search results by format (`f:modern`) would cover only the first.

So every add path calls the same function, `checkCardAdd`. It checks the card's legality, color identity (Commander only), the copy limit, and the zone's size, in that order, and returns a reason a person can read. The search filter still runs, because it keeps illegal cards out of the results, but it is a convenience. The rule is `checkCardAdd`.

Copies are counted by card name across the main deck and sideboard together, because that is how the tournament rules count them. Four Lightning Bolts in the main deck means none in the sideboard.

## Saved legalities go stale

A saved card keeps the `legalities` Scryfall reported on the day it was added. When a card is banned later, the saved copy still says `legal`.

The deck builder and deck detail page already ask Scryfall for every card in the deck, to show live prices. That same `/cards/collection` response includes current legalities, so the app keeps them as well (`useCardLegalities`). The decklist flags and the **Format legality** panel therefore reflect today's ban list, and the refresh costs no extra requests against Scryfall's rate limit.

Home doesn't refresh. Fetching every card of every deck just to draw the library would mean hundreds of requests, which is the same reason Home's deck value uses saved prices. Home's "Also legal in" badges can lag a ban until you open the deck.

## Switching format flags, it doesn't delete

When a deck changes format, some cards may break the new rules. The app keeps them and flags them, instead of removing them. A format switch is often exploratory ("is this list close to Legacy-legal?"), and deleting cards would make a mistaken switch costly. Switching back clears every flag.

Commander needs one structural step. A Commander deck's commander and partner move into the main deck when it becomes a 60-card deck, because no other format has a command zone. Going the other way leaves the commander slot empty to pick.

Import is a deliberate exception. A file that breaks its own format's copy limit is still rejected, keeping the guarantee from tasks/021 that an imported Commander deck can't contain two copies of a card. Other problems in an imported file, such as a card banned since it was exported, import and are flagged like any other.

## "Also legal in"

The deck's chosen format decides which rules the builder enforces. But many decks are legal in more than one format. A Pauper deck is often also legal in Legacy and Vintage, and sometimes in Modern. So the app checks the deck against every format and shows each one as legal, card-legal but not yet the right size ("incomplete"), or not legal.

A Commander deck can be legal in a 60-card format. Its 100 singleton cards, commander included, are a valid Legacy main deck if every card is Legacy-legal. A 60-card deck is never Commander-legal, because it has no commander.

## The sideboard is its own list

The sideboard is stored as a separate `Deck.sideboard` array (and `decks.sideboard` column), not as a flag on each card. Everything that already reads `deck.entries` (metrics, the simulator, the gallery, versions, suggestions) means "the main deck" and needed no changes. Only the copy-limit check and price totals look at both lists.

## What's left out

Suggestions come from EDHREC, which only covers Commander, so the **Suggestions** tab appears only for Commander decks. Version swaps cover the main deck only. Commander variants with their own commander rules (Brawl, Pauper Commander, Oathbreaker) and companions aren't supported.
