# Future Updates to the App

## React Dev Items

### Optimistic Update

We should optimistically update the UI for objective tagging and wishlists (anything related to adding something to a list)
seeing as the UI is pretty slow (relatively) now that it is reading/writing to the DB.

### Skeleton Loading

Loading needs to be more robust than just a simple text line, skeleton is your friend here.

## BUG: Stale chart bar modal items on click in version compare mode

When clicking on a chart bar in version compare, the contents of the modal that appears is stale to the first chart you interact with. This means cards that were added in the new version do not display and it can be confusing.

## Auto Save Deck Build on Card Add

## Add Better Swapping Logic

Swapping out cards is a little clunky. Not being able to see any information about your wishlist cards when in the swap menu really slows down your ability to make meaningful deck versions:

- You should be able to tag items in your deck's wishlist with objectives
- Or you should at least be able to expand the cards in the wishlist swap area to better read their description

## Themes

A user should have the ability to choose between a selection of themes to alter the appearance of the application. This selector should live in the header. Some possible selections could be:

- Default Light
- Default Dark
- Identity Combos (WUBRG or some combination of these?)
- Vampire
- Forest

## Card/Token Suggestion for Decks

It would be a nice feature if the app could auto suggest cards that may go well
with your deck and also show you all of the token cards that would go well with your
deck based on the text descriptions of the cards you have added into your deck.

## Dual-sided cards can be flipped to see both sides

## Compare Decks, Not Just Deck Versions

It may be helpful to compare your decks against one another instead of just different versions of one deck to maybe get a sense of strategy differences that would help with another deck.

## Sub-Sorting

Users should be able to sort by multiple properties, such as `Type` and `Color` and get an organized view.

## Move Filter Logic to Shareable Component

The wishlist and the gallery share basically the same filtering logic with only one minor difference. The shared logic should be moved to its own file and shared across the pages.
