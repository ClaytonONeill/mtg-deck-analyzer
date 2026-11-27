# Tune a deck with objectives and versions

In this tutorial you take the **Ezuri Elves** deck from the previous tutorial through one full round of tuning: you give it a strategy, tag some cards, try out a card swap as a saved version, compare it with the original, and make it the new main list.

## Introduction

A deck is never finished. You try a card, see how it changes the deck, and keep it or put the old one back. MTG Deck Analyzer supports this with two tools:

- **Objectives** are your own tags, such as "Go wide" or "Finishers". You use them to mark what a card does in your plan. When you pick one or two of them as the deck's overall plan, they become the deck's **Strategy**.
- **Versions** are named sets of card swaps saved on top of the deck's **main** list (the list you built). You can try a version and compare it with main without changing main.

By the end you will have:

- two objectives, one of them set as the deck's Strategy
- three cards tagged with objectives
- a version that swaps Elvish Visionary for Mind Stone, which you will compare with main and then make the new main list

The main thing you'll learn is the tuning loop: **stage a swap → save it as a version → compare → promote**.

## Prerequisites

- You can sign in to MTG Deck Analyzer.
- You have the **Ezuri Elves** deck from [Build your first Commander deck](build-your-first-deck.md). Its commander is Ezuri, Renegade Leader, and it holds ten green cards and ten Forests.

You don't need to change any settings or install anything. Every change in this tutorial saves automatically. If a save fails, a "Couldn't save your deck changes." message appears at the bottom of the page. Click **Retry** to save again.

## Step 1: Create two objectives

Objectives are shared by all your decks, so you create them on their own page.

1. In the header at the top of any page, click **Objectives**.
2. In the **Short Label** field, type `Go wide`.
3. In **Description (Optional)**, type `Fills the board with creatures and tokens`.
4. Click **Create Objective**.
5. Make a second objective in the same way. Use `Finishers` as the label and `Ends the game once the board is set` as the description.

Both objectives now appear under **Existing Objectives** as colored pills.

> The page also offers "Quick picks" such as Ramp and Card Draw. Leave those for now. The app already detects jobs like ramp, draw, and removal from each card's rules text. It shows them as **Card Roles**, so you never need to tag them yourself.

## Step 2: Set the deck's Strategy

1. Click the app name in the header to go to the home page.
2. On the **Ezuri Elves** card, click **View**. The deck page opens.
3. Below the commander's name is the **Strategy:** line. Right now it says "No strategic objective set".
4. Click the small **+** button next to it. A menu titled "Set Strategic Objective" opens.
5. Click **Go wide**.

The Strategy line now shows a **Go wide** pill. That's the deck's plan. Most decks only need one or two.

## Step 3: Tag three cards in the Gallery

Now mark which cards carry out that plan.

1. Click the **Gallery** tab. Every card in the deck is shown as an image.
2. Find **Llanowar Elves**. Below its name, click the round **+** button. A menu titled "Tag with Objective" opens.
3. Click **Go wide**. A **Go wide** pill appears under the card.
4. Tag **Elvish Mystic** with **Go wide** in the same way.
5. Find **Craterhoof Behemoth**, the card that wins the game once your board is full of Elves. Tag it with **Finishers**.

Three cards now show colored objective pills. You may also see gray labels such as "Ramp" on some cards. Those are the Card Roles the app detected, and you can't edit them.

## Step 4: Stage a swap

A swap means "take this card out, put that card in." First you *stage* a swap, which means you plan it without changing the deck.

1. Still on the **Gallery** tab, find **Elvish Visionary** and click its **⇄ Swap** button.
2. A panel slides in from the right with the heading "Swapping Out" and "Elvish Visionary". Leave the **Search** tab selected.
3. In the **Replacement Name** field, type `Mind Stone`, then click the result named exactly **Mind Stone**. It's a colorless artifact, so it's legal in a green deck.
4. Click **Confirm Swap with Mind Stone**.

The panel closes. You can see the swap in three places:

- A **Pending Swap** box appears at the top of the Gallery, showing `− Elvish Visionary → + Mind Stone`.
- Elvish Visionary is grayed out with a "Swapped Out" label.
- Elvish Visionary's name now has `→ Mind Stone` under it.

Nothing is saved yet. The **Undo** button in the Pending Swap box would cancel the swap.

## Step 5: Save the swap as a version

1. In the Pending Swap box, click **Save Changes**. The "Save Version" dialog opens.
2. In **VERSION NAME**, type `More Mana`.
3. In **NOTE (OPTIONAL)**, type `Testing Mind Stone for a faster start`.
4. Click **Save Version**.

The Pending Swap box disappears and Elvish Visionary looks normal again. That's expected: you're still looking at **main**, and main hasn't changed. Your swap now lives in the **More Mana** version.

## Step 6: Switch between Main and the version

The **Viewing** bar sits above the tabs. Its drop-down shows which list the page is showing.

1. Open the **Viewing** drop-down. It lists **Main — Ezuri Elves** and **More Mana**.
2. Choose **More Mana**. In the Gallery, Mind Stone now appears and Elvish Visionary is gone.
3. Choose **Main — Ezuri Elves** again. Elvish Visionary is back.

Every tab follows this drop-down. The Metrics charts, the Simulator, and Suggestions all show whichever list you pick.

## Step 7: Compare the version with main

1. Set **Viewing** to **More Mana**.
2. Click the **Metrics** tab, then click **Compare**.
3. Check the two drop-downs: **Comparison Base** should show **Main — Ezuri Elves**, and **Target Version** should show **More Mana**.

Under them, a "Changelog" box lists Elvish Visionary under **Removed** and Mind Stone under **Added**. Below that, side-by-side **By Type** charts show both lists: More Mana has one creature fewer and one artifact more than main. Click **By CMC** to compare the mana curves too.

## Step 8: Promote the version to main

You're happy with the swap, so make it the deck's real list.

1. Make sure **Viewing** is set to **More Mana**. Then click **Set as Main** in the Viewing bar.
2. A dialog asks `Set "More Mana" as the main build?` and warns that this replaces the current main deck list. Click **Set as Main**.
3. A second dialog appears, `Delete "More Mana"?`. Click **Delete Version**.

Promoting changes main but doesn't delete the version on its own, so the app asks about that separately. The version's swaps were written against the old main list, so keeping it would show wrong results later. Deleting it is the safe choice. [How deck versions work](../explanation/how-deck-versions-work.md#promoting-a-version-to-main) explains why.

**Viewing** now shows **Main — Ezuri Elves**. Open the **Gallery** tab and you'll see Mind Stone in the main list, and Elvish Visionary is gone. Your three objective tags and the **Go wide** strategy are still there.

## Final result review

Your deck now has:

- a **Strategy** (Go wide) that describes its plan
- three cards (Llanowar Elves, Elvish Mystic, Craterhoof Behemoth) tagged with your own objectives, shown next to the Card Roles the app detects for you
- a main list where Mind Stone replaces Elvish Visionary, a swap you tested in a version before committing to it

You also learned the tuning loop you'll use every time you change a deck: stage swaps in the Gallery, save them as a version, compare the version with main, and promote it when you're sure.

## Next steps

- [Manage deck versions](../how-to/manage-deck-versions.md): add swaps to an existing version, branch one version from another, or delete versions.
- [Tag cards and set a deck strategy](../how-to/tag-cards-and-set-strategy.md): more ways to tag and filter cards.
- [Get card suggestions](../how-to/get-card-suggestions.md): let the app suggest cards for your strategy and swap them in.
- [Test opening hands](../how-to/test-opening-hands.md): draw sample hands from main or from a version.
- [Strategy, Objectives, and Card Roles](../explanation/strategy-objectives-and-card-roles.md): why the app keeps these three separate.
- [How deck versions work](../explanation/how-deck-versions-work.md): what a version stores and how promotion works.
