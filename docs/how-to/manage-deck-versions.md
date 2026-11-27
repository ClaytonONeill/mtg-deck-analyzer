# Manage deck versions

This guide shows how to save, update, switch, compare, promote, and delete versions of a deck on the deck detail page.

## Goal

A version is a named set of card swaps layered on top of your deck's main build. Use this guide when you want to try out changes without editing the main list, or when you're ready to adopt or discard changes you've already tried. It assumes you already have a saved deck and know how to open it. If this is your first time with versions, work through [Tune a deck with objectives and versions](../tutorials/tune-a-deck-with-versions.md) first.

## Prerequisites

- A saved deck, open on its detail page (the page with the **Metrics**, **Gallery**, **Simulator**, **Deck Wishlist**, and **Suggestions** tabs).

## Save staged swaps as a new version

1. In the **Viewing** selector, choose the build you want to start from. Pick `Main — <deck name>` to start from the main build, or pick a saved version to branch off it.
2. Stage one or more swaps:
   - On the **Gallery** tab, click **Swap** on a card. In the **Swapping Out** panel, find a replacement on the **Search**, **Wishlist**, or **Suggested** tab. Then click **Confirm Swap with <card>**.
   - Or, on the **Suggestions** tab, click **Swap in** on a suggested card, then pick the card it replaces. A "Staged: …" notice appears. Click **Review in Gallery** to go back to the Gallery tab.
3. On the **Gallery** tab, check the **Pending Swaps** banner. Click **Undo** next to any swap you don't want.
4. Click **Save Changes** in the banner. The **Save Version** dialog opens.
5. If you're viewing a saved version, click **Branch as New**. (When you're viewing the main build, this is the only mode, so there's no toggle.)
6. Enter a **VERSION NAME**. You can also add a **NOTE (OPTIONAL)**. Then click **Save Version**.

A branched version contains the base version's existing swaps and Objective overrides, plus your new swaps. The **Viewing** selector stays on the build you started from, and the new version appears in its list.

Staged swaps are kept only in the page's memory until you save them. Leaving the deck page throws them away.

## Add swaps to an existing version

1. In the **Viewing** selector, choose the version you want to add to.
2. Stage swaps and click **Save Changes**, as in steps 2–4 above.
3. In the **Save Version** dialog, leave **Update "<version name>"** selected. It's the default when you're viewing a version.
4. Click **Update Version**.

The new swaps are added to the end of that version's swap history. You can only update the version you're currently viewing. To add swaps to a different version, switch to it first.

## Switch the active version

Choose a build from the **Viewing** selector. Every tab then shows that build: **Metrics**, **Gallery**, **Simulator**, and **Suggestions**. **Export** also uses it. Objectives you tag on the **Gallery** tab while viewing a version are saved only to that version, not to the main build.

Switching restarts the hand simulator at turn 1, and **Suggestions** are worked out again for the new build. Staged swaps stay in the **Pending Swaps** banner. When you save them, they go to whichever build you're viewing at that moment.

## Compare versions

1. Open the **Metrics** tab and click **Compare**.
2. Under **Base**, pick the build to compare from. It defaults to the main build.
3. Under **Target**, pick the build to compare to. It defaults to the version you're viewing. If you're viewing the main build, it defaults to the first saved version. The ⇄ button between the two flips them.

Four summary tiles show the number of cards changed, the price change, and the average mana value and land count of both builds. Below them, three sub-tabs:

- **Swaps** lists each change as a pair: the card that left (red, −) and the card that replaced it (green, +), grouped by card type. Two versions that both replaced the same main-deck card are paired with each other. A change with no counterpart shows "Nothing added" or "Nothing removed." Click or tap a pair to see both cards full size. If the builds have the same cards, it says "These versions have the same cards."
- **Charts** shows a head-to-head chart with each build's count per card type (or per mana value) as two bars, then each build's color breakdown on a shared scale. Use **By Type** / **By Mana Value** and **Include Lands** to change all three charts.
- **Stats** shows tables of both builds' numbers and the change: overview (cards, lands, average mana value, price), card types, Card Roles, color demand, and objective tags.

## Promote a version to main

1. In the **Viewing** selector, choose the version.
2. Click **Set as Main**.
3. In the confirmation dialog, click **Set as Main** again. This replaces the main deck list and can't be undone.

The **Viewing** selector switches back to the main build. A second dialog then asks whether to delete the version you just merged. Its saved swaps were computed against the old main build, so if you keep it, it may show incorrect results when you view, compare, or export it later. Click **Delete Version** to remove it, or **Keep Version** to keep it.

## Delete a version

1. In the **Viewing** selector, choose the version.
2. Click **Delete Version**.
3. In the `Delete "<version name>"?` dialog, click **Delete Version** to confirm. This can't be undone.

The **Viewing** selector switches back to the main build. The main build itself can't be deleted from here. **Set as Main** and **Delete Version** only appear when you're viewing a saved version.

## Work around current limits

The app can't do these yet:

- **Rename a version or edit its note.** To change the name or note, branch a new version off it with the right name and note, then delete the old one.
- **Remove one swap from a saved version.** To drop a swap, rebuild the version from the main build without that swap, then delete the old version.

Both gaps are tracked in [tasks/007](../../tasks/007-deck-version-editing-gaps.md).

## Final result

The **Viewing** selector lists `Main — <deck name>` and each saved version by name. When you choose a version, the Gallery and Metrics tabs show the deck with that version's swaps applied. **Compare** shows the exact card differences between any two builds. Changes save automatically. If a save fails, a "Couldn't save your deck changes." alert appears with a **Retry** button.

## Next steps

- [How deck versions work](../explanation/how-deck-versions-work.md): why versions store swaps rather than full lists, and what that means for promoting.
- [Screens and tabs](../reference/screens-and-tabs.md): every control on the deck detail page.
- [Get card suggestions](get-card-suggestions.md): find replacement cards to stage as swaps.
- [Tag cards and set strategy](tag-cards-and-set-strategy.md): tag Objectives per version.
