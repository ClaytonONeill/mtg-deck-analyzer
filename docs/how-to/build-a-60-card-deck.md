# Build a deck for Standard, Pioneer, Modern, Legacy, Vintage, or Pauper

Use this guide to build a 60-card deck with a sideboard, or to move an existing deck to another format. It assumes you know the deck builder from [Build your first Commander deck](../tutorials/build-your-first-deck.md).

The rules for each format are listed in [Deck rules](../reference/deck-rules.md#formats).

## Start a deck in a format

1. Select **+ New Deck** in the header.
2. Type a name in **Deck Identity**.
3. In the format menu next to the name, choose the format. The line under the name summarizes its rules, for example "Modern: at least 60 cards, up to 4 copies of each card, and a sideboard of up to 15."

There's no commander to pick, so the card search appears at once. Cards autosave as you add them, once the deck has a name.

## Add cards to the main deck or sideboard

1. Above the card search, choose **Main deck** or **Sideboard (n/15)**.
2. Search for a card and select it. The search only shows cards legal in the deck's format.
3. To add more copies, select **+** on the card's row in the **Decklist**. Each row has these controls, which appear on hover on desktop:
   - **+** adds a copy. It is disabled when the card is at its limit; hover over it to see why, for example "Modern allows at most 4 copies of Lightning Bolt."
   - **−** removes a copy.
   - The arrow button moves one copy between the main deck and the sideboard.
4. Add basic lands with the **Basic Lands** panel. Basics have no copy limit.

If a card can't be added, an alert under the search says why: it isn't legal in the format, you already have the most copies allowed, or the sideboard is full. Copies in the main deck and sideboard count together.

The **Deck at a Glance** panel shows the main deck against "60+" and the sideboard against 15. The deck counts as complete at 60 cards or more.

## Change an existing deck's format

1. Open the deck in the builder (**Edit** on its Home card).
2. Choose the new format in the format menu.
3. If the deck has cards, a dialog says how many cards break the new format's rules. Select **Switch format**.

No cards are removed. Cards that break the new rules are flagged in the **Decklist** with a warning icon and the reason, and an alert above the list summarizes the problems. Remove or replace them to make the deck legal. Switching back clears the flags.

- Switching a Commander deck to another format moves the commander and partner into the main deck.
- Switching to Commander leaves the commander slot empty, so pick one next. A sideboard isn't allowed in Commander: its cards are flagged, and each has a button to move it into the main deck.

## See which other formats the deck is legal in

- On **Home**, each deck card shows its format, then "Also legal in" with the other formats the deck qualifies for. An outlined badge means every card is legal there but the deck isn't the right size yet.
- On the deck page, open **Format legality** to see every format, with the reason for each one the deck isn't legal in, for example "Not legal: Ragavan, Nimble Pilferer".

The deck page and the builder check against today's ban lists. Home uses the legality saved with each card when it was added, so it can miss a recent ban.

## Find decks by format on Home

- To show one format only, choose it in the **All formats** menu.
- To group decks by format, choose **Format** in the sort menu.

## Limits

- The **Suggestions** tab appears only for Commander decks.
- Versions cover the main deck only. Sideboard changes aren't saved as part of a version.

## Related

- [Deck rules](../reference/deck-rules.md): exact limits, messages, and where each rule is checked
- [Formats and legality](../explanation/formats-and-legality.md): why the app checks legality the way it does
- [Import and export a deck](import-and-export-a-deck.md): exports include a `Sideboard` section
