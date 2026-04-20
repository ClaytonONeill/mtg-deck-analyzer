# Future Updates to the App

## React Dev Items

### Skeleton Loading

Loading needs to be more robust than just a simple text line, skeleton is your friend here.

## Auto Save Deck Build on Card Add

## Card/Token Suggestion for Decks

It would be a nice feature if the app could auto suggest cards that may go well
with your deck and also show you all of the token cards that would go well with your
deck based on the text descriptions of the cards you have added into your deck.

## Dual-sided cards can be flipped to see both sides

## Compare Decks, Not Just Deck Versions

It may be helpful to compare your decks against one another instead of just different versions of one deck to maybe get a sense of strategy differences that would help with another deck.

## Sub-Sorting

Users should be able to sort by multiple properties, such as `Type` and `Color` and get an organized view.

## View Commander Cards in Gallery View

Right now you can only see the cards within the deck but cannot see your own commander card.

## Confirm Delete Modal

It is currently way too easy to delete your deck on accident, a confirm delete modal needs to be instituted for decks and deck versions.

## BUG: Clicking "New Deck" from Edit Deck View is Broken

The current behavior does not clear out the existing deck items when hitting new deck, it just renders the import button - this needs to be corrected or just
remove the "New Deck" option from this view.

## Objectives Menu Should be a Standardized Shared Component

There currently exist two or three instances of this with differing functionality, this is bad UX.

## Deck Objective Overhaul

In the simulator (which is another bug project), you can hide objectives on click but there is no way to turn them back on without resetting the whole page.
You should be able to reset the list itself. It would also be a better UX if the relevant objectives just appeared as they were encountered instead of a list of
all possible objectives - you can see how with multiple decks this would be a pain even with a better toggle system.

## BUG: Duplicate Cards can be Added to the Deck

In commander format, you cannot have two of the same (non-basic land) card - there is currently no check in place to prevent that from happening.
