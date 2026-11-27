# How deck versions work

This page explains what a deck version is underneath, why it's stored as a list of changes rather than a copy of the deck, and what that choice means when the deck changes.

For the steps to create, compare, and promote versions, see [Manage deck versions](../how-to/manage-deck-versions.md).

## A version is a diff, not a deck

Every deck has one **main** card list (`Deck.entries`). A version doesn't keep its own card list. It's a small record stored inside the deck (`Deck.versions`, defined as `DeckVersion` in `src/types/index.ts`) that holds:

- a **name** and an optional **note**
- an ordered list of **swaps**. Each swap pairs the ID of a card to take out (`removeCardId`) with a full Scryfall card to put in (`addCard`).
- a list of **objective overrides**, each mapping a card ID to the set of Objective tags that card carries *in this version*

There's no stored "version deck". Whenever the app needs one (viewing the version on the deck page, comparing it, exporting it, or feeding it to Suggestions), it rebuilds it from main with `applyVersionToDeck()` in `src/features/deckVersions/utils/versionUtils.ts`. That function:

1. Copies main's entries.
2. Walks the swaps in order. For each one, it lowers the removed card's quantity by one and drops the entry if it reaches zero. Then it adds the incoming card: a new entry at quantity 1, or one more copy if that card is already in the list.
3. Applies the objective overrides to any card in the result that has one, replacing that card's Objective tags.

Version patches work like a recipe that says "start from main, take out X, put in Y" rather than a second shopping list. Swaps run in order, so a later swap can take out a card that an earlier swap put in.

## Why diffs instead of copies

Storing a version as a diff has two benefits for an app this size.

**Comparison is about the change itself.** A version's swap list *is* the answer to "how does this build differ from main?" Nothing has to be lined up and diffed card by card to find it. The compare view (`VersionCompare.tsx`) still rebuilds both sides with `applyVersionToDeck()` to draw its charts and card differences, but that rebuild is cheap. It's one pass over about 100 cards per swap.

**Edits to main reach every version.** Since a version only records what's *different*, any card you add to main appears in every version automatically. For example, the Suggestions tab's "Add to deck" button writes to main ("every version is built on" it, per the comment in `DeckDetailPage.tsx`). A card added there shows up in each version without touching any of them. If you kept full copies, you'd have to add the card to every copy by hand, and the copies would slowly drift apart.

The cost of this design is that a version's meaning depends on main. Swaps are instructions, not a snapshot. The next two sections cover what happens when main moves under those instructions.

## When main changes under a version

Swaps find the card to remove by its exact Scryfall card ID, which identifies one printing. `applyVersionToDeck()` doesn't check whether that card is still in main. So:

- **If the removed card is gone from main**, that swap's removal does nothing, but its addition still happens. The version ends up with one *more* card than main instead of the same count. This can happen if you cut the card from main, or if main now holds a different printing of it (a different ID).
- **If the incoming card is now also in main**, the addition raises that entry's quantity instead of creating a new one. The version then shows two copies of a card that Commander's singleton rule allows only once. The Suggestions tab disables "Swap in" for any card already in the version or in main, matching by name, so you can't stage such a swap from there. That check can't stop main from gaining the card later.
- **If main gains or loses cards that no swap mentions**, the version simply follows main.

None of these cases produce an error. The version still renders, but it may no longer match what you meant when you saved it. The deck's card count and the compare view are the quickest places to notice.

## Objective overrides in a version

Objective tags (the hand-applied per-card tags, `DeckEntry.objectiveIds`) belong to main. A version can't edit main's tags. It records overrides instead. When you're viewing a version and tag a card, the deck page sends the change to `assignObjectiveToVersion` / `unassignObjectiveFromVersion` in `useDeckVersions`, not to main.

A few consequences follow from how overrides are built and applied:

- An override *replaces* the card's tag set. It doesn't add to it. The first time you tag a card in a version, the override starts with only that new Objective. So inside that version, the card stops showing the tags it has in main.
- A card brought in by a swap starts with no tags unless the version has an override for it. It doesn't inherit the tags of the card it replaced.
- If a swap adds a copy of a card that's already in the list, that entry's tags are reset to the version's override for it, or to none.

The deck's *Strategy* (`Deck.objectives`) isn't part of a version. All versions share it.

## Branching and appending

When you save staged swaps while viewing a version, the "Save Version" dialog gives you two options. Its labels are `Update "<version name>"` and "Branch as New".

- **Update** calls `appendToVersion`, which adds the new swaps to the end of that version's list. The version's name, note, and overrides stay the same.
- **Branch as New** calls `saveAsVersion` with the current version as its base. The new version gets a *copy* of the base's swaps and overrides, followed by the new swaps. After that, the two versions are separate. Later changes to the base don't carry into the branch. Branching from main starts with only the new swaps.

So versions form a flat list, not a tree. A branch has no lasting link to the version it came from.

## Promoting a version to main

The "Set as Main" button runs `promoteVersionToMain`. It rebuilds the version with `applyVersionToDeck()` and writes the result back as main's `entries`, including the overridden Objective tags. Nothing else on the deck changes. The confirmation dialog warns that this "replaces the current main deck list" and can't be undone.

Promoting *keeps* the version. The deck page then asks, in a separate dialog, whether to delete it ("Delete Version") or keep it ("Keep Version"). Keeping it is allowed, but the diff design makes it risky. The version's swaps were written against the *old* main. Applied to the new main, every removal points to a card that's already gone, and every addition adds a second copy of a card that's already there. The dialog says so: the swaps "were computed against the previous main build, so keeping it may show incorrect results if you view, compare, or export it later."

## Known gaps

These are the limits of version editing today, scoped in [`tasks/007`](../../tasks/007-deck-version-editing-gaps.md):

- **Name and note can't be changed after creation.** `useDeckVersions` exports `updateVersion(versionId, name, note)`, but no UI calls it.
- **Saved swaps can't be removed one at a time.** You can undo staged swaps in the Gallery before saving. Once they're part of a version, the only tools are appending more swaps or deleting the whole version.

The task notes that the product owner should confirm the scope before either gap is built.

## Where the pieces live

- `src/features/deckVersions/utils/versionUtils.ts`: `applyVersionToDeck()`, the one place a version becomes a card list
- `src/features/deckVersions/hooks/useDeckVersions.ts`: create, append, delete, rename, override, and promote. These are pure functions. Each builds the updated deck and passes it to the deck page's autosave (`commitDeck`), which saves it. The hook never calls `deckStore.save` itself.
- `src/pages/DeckDetailPage.tsx`: chooses main or a version for display, sends tag edits to the right place, and runs the confirm dialogs
- `src/features/deckVersions/components/SaveVersionModal.tsx` and `VersionCompare.tsx`: the save dialog and the compare view

## Related

- [Manage deck versions](../how-to/manage-deck-versions.md): the steps for saving, comparing, promoting, and deleting versions
- [Tune a deck with objectives and versions](../tutorials/tune-a-deck-with-versions.md): a guided first pass through versions
- [Strategy, Objectives, and Card Roles](strategy-objectives-and-card-roles.md): how version overrides interact with objectives
