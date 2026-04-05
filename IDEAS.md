# Future Updates to the App

## React Dev Items

### Optimistic Update

We should optimistically update the UI for objective tagging and wishlists (anything related to adding something to a list)
seeing as the UI is pretty slow (relatively) now that it is reading/writing to the DB.

### Skeleton Loading

Loading needs to be more robust than just a simple text line, skeleton is your friend here.

## Responsive Styling and General Mobile Optimization

The app works well (enough) on a desktop/laptop - but struggles on a mobile device. Time should be spent to
correct all of the spacing issues that occur when viewing on a phone.

## Auto Save Deck Build on Card Add

## Dual Mana Pips and Basic Land Cards

I need to have support dual mana pips (like white/blue mana - can be seen in a lot of mimic cards) as well as have the basic
land cards in public folder for when users interact with the `Types` or `CMC` charts when lands are turned on.

Currently, there are "missing image" icons showing for these items and that should be corrected.

## Deck Versioning

This feature would allow users to swap out certain cards from a fully-built deck to
see metrics against different optimization strategies. The feature would include:

1. The ability to swap out individual cards within your deck and save those alterations as a new version of the deck, also exportable.

2. The ability to perform side-by-side comparisons between versions to see type and CMC analysis as well as objective completeness.

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

## Wish List

Cards that you want to add to a deck but are not ready to make swaps directly should be able to be added to a wish list. Cards in this whish list should
be able to be added to a deck, so you can see the wishlist for a deck while viewing the details for that deck.

We may want to consider abstracting out the logic for the deck detail/swap search into a reusable component users can search for cards directly from the home page.
We should also make it so users can access the wish list search page from both the home page and inside the deck detail view.

## Compare Decks, Not Just Deck Versions

It may be helpful to compare your decks against one another instead of just different versions of one deck to maybe get a sense of strategy differences that would help with another deck.

## Sub-Sorting

Users should be able to sort by multiple properties, such as `Type` and `Color` and get an organized view.

## User Log-in

This will likely be one of the last updates. We are going to build out the back end and persist user data in a DB so we no longer need the export deck function to save decks and view them on different machines.

### Make Sure Wishlists are Attached to Decks/Users

## Move Filter Logic to Shareable Component

The wishlist and the gallery share basically the same filtering logic with only one minor difference. The shared logic should be moved to its own file and shared across the pages.
