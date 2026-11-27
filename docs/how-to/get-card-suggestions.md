# Get card suggestions

Use this guide to find cards to add to a deck, or to find a replacement for one card, and then act on what you find.

## Goal

When you are done, you will have suggestions for the deck version you are viewing. You will also have added a suggestion to the deck, staged it as a swap, or saved it to the deck's wishlist. Use this guide when a deck has open slots, or when one card is underperforming and you want a like-for-like replacement. It assumes you can already open a deck and switch between its versions.

## Prerequisites

- A deck with a commander. Without one, suggestions don't use EDHREC's commander data.
- Optional: a deck Strategy and per-card Objectives, which steer the results. See [Tag cards and set a deck strategy](tag-cards-and-set-strategy.md).

## Steps

### 1. Pick the version you want suggestions for

1. Open the deck.
2. In the **Viewing** selector, choose the version. `Main — <deck name>` is the main list.

Suggestions are computed from the version you are viewing. Cards already in it, your commanders, and cards staged by pending swaps are left out. If you switch versions, the suggestions are worked out again.

### 2. Open the Suggestions tab

Select the **Suggestions** tab. The heading reads **Suggestions for Main**, or **Suggestions for** the version's name.

Under the heading:

- **Based on:** lists what the suggestions draw on, such as the commander on EDHREC with its deck count, any EDHREC builds it matched, and signals from your deck.
- **Commander data from EDHREC** links to the commander's EDHREC page.
- If EDHREC has no page for the commander, or can't be reached, a note says suggestions come from your deck's cards and objectives alone. In the second case, select **Retry** to try EDHREC again.

### 3. Choose Top picks or Hidden gems

Use the toggle next to the heading:

- **Top picks**: the strongest fits for this commander and deck.
- **Hidden gems**: favors cards that fit the deck but that few decks play yet.

The app remembers your choice in this browser.

### 4. Read the reason chips

Each card shows up to three chips that say why it was suggested. If there are more reasons, a **+N** chip appears. Hover it to see the rest. Select a card's image to see it larger.

### 5. Load more results if you need them

Suggestions load 8 at a time. Select **Show more (N left)** to load 8 more. You can do this up to three times, for at most 32 cards. After that, the panel says: "That's the strongest set; beyond this, suggestions get noisy."

### 6. Act on a suggestion

Each suggestion has these buttons:

- **Wishlist**: adds the card to your wishlist and tags it to this deck. The button then reads **Wishlisted**.
- **Add to deck**: adds the card to the **main** list straight away and saves it, even if you are viewing another version. Every version is built on the main list. This button appears only while the deck has fewer than 100 cards. A card you add stays in the grid as **Already in deck** until you leave the tab or switch versions.
- **Swap in**: stages the card as a replacement for a card in the version you are viewing:
  1. In the **Swap in \<card\>** dialog, pick the card it replaces. Cards that share its type or role are listed first under **Suggested to replace**. Everything else is under **Rest of the deck**. Basic lands aren't listed. Use **Filter your deck...** to narrow the list.
  2. A notice confirms: "Staged: \<card\> in for \<card\>." Select **Review in Gallery** to see the swap.
  3. In the Gallery's **Pending Swaps** banner, select **Save Changes** to save the swap into a version. See [Manage deck versions](manage-deck-versions.md).

### Find a replacement for one specific card

To get suggestions aimed at one card rather than the whole deck:

1. On the **Gallery** tab, select **Swap** on the card.
2. In the sidebar, open the **Suggested** tab.
3. Leave **For \<card name\>** selected. The panel heading reads **Replacements for \<card name\>**. To get general suggestions instead, select **For the deck**.
4. Select **Select** on the replacement you want, then select **Confirm Swap with \<card\>**.

The swap appears in the **Pending Swaps** banner. Save it with **Save Changes**, the same as in step 6.

### Steer the results

Suggestions use the deck's Strategy and the Objectives on its cards. Objectives only boost results, so suggestions still work without them. To change what you get, adjust them as described in [Tag cards and set a deck strategy](tag-cards-and-set-strategy.md).

## Final Result

- A card you added shows **Already in deck**, and the deck's card count goes up.
- A wishlisted card shows **Wishlisted**, and it is listed on the deck's **Deck Wishlist** tab.
- A swapped card is listed in the Gallery's **Pending Swaps** banner until you save it or select **Undo**.

## Troubleshooting

- **"No suggestions found for this deck."** Nothing fit the version you are viewing. Try **Hidden gems**, or add a Strategy.
- **An error with Try again.** Scryfall couldn't be reached and there was no EDHREC data to fall back on. Select **Try again**.
- **"Some suggestions couldn't load (…)."** The Scryfall searches failed, but the EDHREC results still show.

## Next Steps

- [How suggestions are chosen](../explanation/how-suggestions-work.md)
- [Manage deck versions](manage-deck-versions.md)
- [Use the wishlist](use-the-wishlist.md)
