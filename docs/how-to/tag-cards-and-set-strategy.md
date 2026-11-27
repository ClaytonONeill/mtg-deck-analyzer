# Tag cards and set a deck strategy

This guide shows you how to create objectives, tag a deck's cards with them, set the deck's Strategy, and filter the gallery by those tags.

## Goal

When you're done, your deck has a Strategy of one or two objectives, its cards carry the objective tags you care about, and you can narrow the **Gallery** to any tag, to untagged cards, or to a detected Card Role. This guide assumes you already have a saved deck and know your way around its deck page. For why Strategy, Objectives, and Card Roles are kept separate, see [Strategy, Objectives, and Card Roles](../explanation/strategy-objectives-and-card-roles.md).

## Prerequisites

- A saved deck. If you don't have one, follow [Build your first deck](../tutorials/build-your-first-deck.md).

## Steps

### 1. Create the objectives you need

Objectives belong to you, not to one deck. Every deck you own uses the same list.

1. Click **Objectives** in the header to open the Objectives page.
2. Under **New Objective**, do one of these:
   - Click a preset under "Quick picks: these also improve card suggestions." It fills in **Short Label** and **Description** for you. Presets are grouped as **Core roles** and **Synergies**. A preset is hidden once you already have an objective with that label.
   - Type your own **Short Label** (20 characters at most) and, if you like, a **Description**. Freeform labels work for tagging, but only preset labels feed card suggestions. The full preset list is in [Card Roles: Recognized objective presets](../reference/card-roles.md#recognized-objective-presets).
3. Click **Create Objective**. The new objective appears under **Existing Objectives** with a color assigned automatically.

You don't need objectives for generic jobs like ramp, card draw, or removal. The app detects those as Card Roles from rules text (see step 5). Use objectives for your own themes and notes, such as "Aristocrats" or "Need to Buy".

### 2. Edit or delete an objective

On the objective's card under **Existing Objectives**, open the three-dot (**⋮**) menu:

- **Edit**: change the label or description, then click **Save** (or **Cancel**). The color can't be changed.
- **Delete**: removes the objective right away. There is no confirmation. Cards tagged with it stop showing that tag.

A deck's Strategy keeps its own copy of each objective you chose. If you rename or delete an objective that's part of a deck's Strategy, the Strategy still shows the old version. Remove it from the Strategy and add it again (step 3) to pick up the change.

### 3. Set or clear the deck's Strategy

1. Open the deck page.
2. Find **Strategy:** in the deck header. If it's empty, it reads "No strategic objective set".
3. Click **+** next to it and pick an objective from the **Set Strategic Objective** menu. Repeat for a second one if your deck has two plans.
4. To clear one, click **×** on its pill.

The app doesn't stop you at two. Once two are set, the menu adds the hint "Usually just 1-2 core objectives work best." The **+** button disappears when every objective you own is already in the Strategy.

Strategy belongs to the whole deck. Choosing a version under **Viewing** doesn't change it, and changes you make while viewing a version apply to the deck. The Strategy is used by [card suggestions](get-card-suggestions.md).

### 4. Tag and untag cards

#### In the Gallery

1. On the deck page, open the **Gallery** tab.
2. On a card, click the **+** button and pick an objective from the **Tag with Objective** menu. The tag appears as a colored pill next to the button.
3. To remove a tag, click **×** on its pill.

The menu lists only objectives the card doesn't already have, and the **+** button is hidden once a card has all of them. A card marked **Swapped Out** can't be tagged until you click **Undo Swap**. Commander tiles at the top of the Gallery can't be tagged.

Tags save with the deck automatically.

#### On wishlist cards

Wishlist entries take objective tags too. Use the **+ Objective** button on a wishlist card, either on the **Wishlist** page or on the deck page's **Deck Wishlist** tab. These tags belong to the wishlist entry, not to any deck card. See [Use the wishlist](use-the-wishlist.md).

No other screen lets you assign objectives. The Simulator, the swap sidebar, and the deck list on the home page show objective pills but can't change them. Tracking work to unify these menus is in [`tasks/018`](../../tasks/018-shared-objectives-assignment-component.md).

### 5. Filter the Gallery by tag or Card Role

1. In the **Gallery** tab, click **Filters**.
2. Pick any combination of chips:
   - Under **Objectives** ("your tags"), click an objective to show only cards with that tag. Only objectives used in this deck are shown, each with its card count.
   - Click **Untagged** to show cards with no objective tag. You can combine it with objective chips.
   - Under **Card Roles** ("detected from card text"), click a role such as Ramp or Removal. Only roles found in this deck appear.
3. Check the **Inventory** count (for example `12 / 63`) to see how many cards match.
4. To reset, click **Clear All Filters**. If nothing matches, click **Clear search & filters**.

Within one group, a card matches if it has *any* of the selected chips. Across groups (Objectives, Card Roles, Type, Color Identity, Mana Value), a card has to match every group you've used. The **Filters** button shows how many chips are active. Filters are kept for the current browser session, separately for each deck.

What each Card Role detects is listed in [Card Roles](../reference/card-roles.md).

## Tagging inside a version

When **Viewing** is set to a saved version instead of **Main**, tagging in the Gallery writes to that version's objective overrides, not to the main deck's tags. An override replaces the card's whole tag set in that version. The first tag you add to a card in a version means the card stops showing its main-deck tags there. Clicking **×** on a tag the card only gets from main does nothing while you view a version. For the full rules, see [How deck versions work: Objective overrides in a version](../explanation/how-deck-versions-work.md#objective-overrides-in-a-version).

## Final Result

- The Objectives page lists your objectives under **Existing Objectives**.
- The deck header shows your one or two objectives after **Strategy:**.
- Gallery cards show colored objective pills, and the **Filters** panel's **Objectives** section lists each tag with a card count.
- Reload the deck page. Your tags and Strategy are still there.

## Next Steps

- [Tune a deck with objectives and versions](../tutorials/tune-a-deck-with-versions.md): the full tuning loop, start to finish.
- [Manage deck versions](manage-deck-versions.md): save, compare, and promote versions.
- [Get card suggestions](get-card-suggestions.md): see how Strategy and preset objectives shape suggestions.
- [Strategy, Objectives, and Card Roles](../explanation/strategy-objectives-and-card-roles.md): why these are three separate things.
- [Card Roles](../reference/card-roles.md): every detected role and preset objective.
