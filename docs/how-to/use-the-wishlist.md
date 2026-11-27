# Use the wishlist

This guide shows how to keep a list of cards you want to acquire, link each one to the decks it's meant for, and review those cards from inside a deck.

## Goal

When you're done, you'll have cards on your wishlist that are tagged to one or more decks and to your Objectives, and you'll see them on each deck's **Deck Wishlist** tab. This guide assumes you already have at least one saved deck (see [Build your first Commander deck](../tutorials/build-your-first-deck.md)).

## Prerequisites

- At least one saved deck, if you want to tag wishlist cards to decks. The **+ Add to Deck** control only appears when there's a deck the card isn't tagged to yet.
- At least one Objective, if you want to tag wishlist cards with Objectives. You create Objectives on the **Objectives** page in the header. The **+ Objective** control is hidden when every Objective is already on the card, or when you haven't made any.

## Steps

### 1. Open the Wishlist page

Click **Wishlist** in the global header. The page header shows a count of every entry on your wishlist.

### 2. Add a card

1. In **Search for a card to wishlist**, type a card name and pick a result.
2. A confirmation panel shows the card's image, type line, and price. You can type a reason in **WHY THIS CARD?** if you like (for example, "For the token subtheme...").
3. Click **Add to Wishlist**. Click **Cancel** if you don't want to add it.

The new entry appears in the list right away. If you pick a card that's already on your wishlist, nothing happens: the confirmation panel doesn't open, so you can't add a duplicate.

> The **WHY THIS CARD?** note is saved with the entry, but no screen shows it yet, and you can't edit it after adding. `wishlistStore.updateNote` exists, but nothing in the UI calls it.

### 3. Tag the card to decks

On the card's entry, under **Tagged Decks**:

- To link it to a deck, click **+ Add to Deck** and choose the deck. The deck appears as a badge.
- To unlink it, click the **×** on that deck's badge.

You can tag one card to as many decks as you want. Tagging links the card to the deck. It doesn't add the card to the deck's list.

### 4. Tag the card with Objectives

Under **Objectives** on the same entry:

- Click **+ Objective** and pick an Objective from the **Tag with Objective** menu.
- To remove one, click the **×** on its pill.

### 5. Narrow the list by deck (or other criteria)

1. Open **Filters** above the list.
2. Under **In Decks**, tick one or more decks. An entry is shown if it's tagged to *any* of the decks you ticked.
3. Combine this with the color, type, mana value, and **Objectives** filters as needed. Click **Clear All Filters** to reset.

Use **Sort By** (Date Added, Name, Mana Value, Color Identity, Type, Price), the **Asc./Desc.** toggle, and the then-by selector to order the results. The counter reads `SHOWING <filtered> / <total>`.

### 6. Review a deck's wishlist

1. Open the deck from the home page.
2. Select the **Deck Wishlist** tab.

This tab lists only the entries tagged to this deck, under a "*N* cards on wishlist" heading. Each entry has the same **Objectives** and **Tagged Decks** controls as on the Wishlist page, so you can retag cards from here. If nothing is tagged to the deck, you'll see "No wishlist cards tagged here."

You can also add cards from the deck's **Suggestions** tab. Click **Wishlist** on a suggestion to add it to your wishlist, already tagged to this deck. The button then reads **Wishlisted**.

### 7. Remove an entry

Click the red **×** at the top right of the entry, on either the Wishlist page or the **Deck Wishlist** tab. This deletes the entry from your wishlist entirely, not just from the current deck. To take a card off one deck only, untag that deck instead (step 3). The delete is immediate: there's no confirmation step.

If a change fails to save, the entry goes back to how it was before your click.

## Final result

- The Wishlist page shows your entries with their deck badges and Objective pills, and the **In Decks** filter narrows the list to a chosen deck.
- Each deck's **Deck Wishlist** tab lists exactly the entries tagged to that deck.
- On the deck's **Gallery** tab, the swap sidebar has a **Wishlist (*N*)** tab with the same entries, ready to stage as swaps.

## Next steps

- [Screens and tabs](../reference/screens-and-tabs.md): what's on each page and deck tab.
- [Tag cards and set a deck strategy](tag-cards-and-set-strategy.md): create and apply Objectives.
- [Get card suggestions](get-card-suggestions.md): find cards to wishlist.
- [Manage deck versions](manage-deck-versions.md): swap wishlisted cards into a version.
