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

## Deck-Level Strategy vs. Card-Level Roles Semantic Clarity

The objectives system currently conflates two distinct concepts: **deck-level strategic objectives** (1-2 core win conditions or themes for a deck, e.g., "Combo Win", "Creature Beatdown") and **card-level roles/qualities** (mechanical tags like "Ramp", "Removal", "Card Draw"). This makes it hard to answer key questions like "Do all my cards support my deck's core strategy?" or "Are there mechanical gaps?" without clearer semantic boundaries. No backend changes needed — this is primarily a UI/data-modeling clarification to help reason about deck coherence.

## Deck Objective Overhaul

In the simulator (which is another bug project), you can hide objectives on click but there is no way to turn them back on without resetting the whole page.
You should be able to reset the list itself. It would also be a better UX if the relevant objectives just appeared as they were encountered instead of a list of
all possible objectives - you can see how with multiple decks this would be a pain even with a better toggle system.

## BUG: Duplicate Cards can be Added to the Deck

In commander format, you cannot have two of the same (non-basic land) card - there is currently no check in place to prevent that from happening.

## BUG: Bleed Over Page on Card Search Results

When the card search results list is shown, it bleeds outside of the page container and has a buggy rearrangement of content. This needs to be corrected.

## BUG: Multiple Deck Versions Create Issues

When multiple deck versions exist and you make changes to a deck in the gallery and go to save, the current version you are on is not the one default selected
to modify. It seems the application just chooses the first "version" off of the original "main" deck. This should always auto choose the version that you have
selected at that moment. This results in users going to make changes to Version C of their deck, and unknowingly modifying Version B.

A similar issue is apparent in the compare setting, where your current deck version is not the default selection.

## BUG: Inconsistent oObjective Tagging Behavior in Wishlist

The objectives dropdown in the wishlist page has major z-axis issues and is truncated by the parent container it opens within,
instead of floating over all content (as it does in other instances where it is used.) Additionally, this version of the objectives
dropdown has color pips, another disparity from the other instances of this component. This should be a normalized, reusable component
with predictable behavior in every instance it appears.

One other bug with the objectives list in the wish list page is that the button to add objectives shifts with every new objective added, when it
should stay anchored to the left side of the row it is on, and objectives fill in to the right; again a behavior that is inconsistent from the way
that objective tagging is working in the gallery, for example.

## Deck Color Breakdown Should Display Below Metrics Chart

The metrics chart shows the color breakdown by the color of the stacked sections or individual lines in the bar graph, but a clean, easy to read
percentage breakdown of the overall color demand of the cards in the deck should be shown in a grid layout below the chart, sorted in descending order
starting with whatever color the most cards fall into. The percentages should reflect the color they are, with a label for the color.

The idea for this additional metric is to enable users to quickly figure out what land types they should favor in a multi-color deck.

## BUG: React-Charts are very hard to use on mobile devices

The touch interface to select a bar in the chart is clunky, and it is very often hard to clear the currently selected tooltip when aiming
to move and look at the graph without a popup again. Another issue on mobile is that you do not get the tool tip breakdown of the color identities
of the cards that comprise a card type or mana cost without clicking on the individual bar, which then brings up the cards modal showing the cards
that comprise that category. To get the tooltip display, you have to then close out of this modal window. This UX needs to be polished for mobile
users. They should be able to interact with the chart similarly to desktop users where they are not locked into or out of certain workflows due to the
lack of a hover capability.

## BUG: Switching the Deck Version While the Simulator is Going Should Reload/Restart the Simulator with the New Deck

The UI does not update when the user switches to another deck in the version drop down while using the simulator. The simulator should
reset to turn 1 when the version is changed, and the new deck should be loaded in.

## Enable Navigating to next Card in Gallery with Arrow Keys or Swipe (on mobile)

When viewing a single card in the gallery, you should be able to quickly move to the next card with the arrow keys on desktop, or swipe left and right on mobile to
move between the cards instead of having to exit and then clicking on another card.

On the desktop, the left and right keyboard arrow icons can be present to show that this action is available. These should be minimalist icons and there should
be no text. Nothing needs to be shown on mobile, users can intuit swipe-ability.
