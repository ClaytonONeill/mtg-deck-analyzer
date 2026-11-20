# Strategy, Objectives, and Card Roles

This page explains the three ways the app labels a deck or a card, what each one means, and why they are kept apart.

A Commander deck invites several questions at once. What is this deck trying to do? What is this particular card here for? What does this card actually do when it resolves? The app answers them with three separate concepts:

| Concept | Answers | Attached to | Set by | Stored? |
|---|---|---|---|---|
| **Strategy** | "What is this deck's plan?" | The deck (`Deck.objectives`) | You, on the deck detail page | Yes |
| **Objectives** | "Why did *I* put this card here?" | Each card (`DeckEntry.objectiveIds`) | You, by hand | Yes |
| **Card Roles** | "What does this card do?" | Each card, on the fly | The app, from rules text | No |

The design history is in [`tasks/023`](../../tasks/023-objectives-semantic-clarity.md). The rest of this page covers why the lines are drawn where they are.

## How it got here: one tag doing three jobs

The app started with a single concept, the **Objective**. It was a freeform, colored label that you created and then tagged onto cards. In practice people used that one tag for three different kinds of information:

- deck themes, such as "Aristocrats" or "Reanimation"
- generic mechanical jobs, such as "Ramp", "Card Draw" or "Removal"
- personal notes, such as "Need to Buy"

Mixing them made the deck hard to read. You couldn't ask whether the cards supported the deck's win plan, because the plan was just another tag next to "Ramp". And "Ramp" turned out to be a fact about a card, not a choice. Every deck has ramp, and whether a card *is* ramp can be read off the card itself.

The fix was to give each kind of information its own home. No new data model was needed.

## Strategy: the deck's one or two plans

Strategy is the deck's core plan, for example "Infinite Mana Combo" or "Creature Aggression". It's stored on the deck as `Deck.objectives`. The name is historical: that field already existed, unused, and was repurposed instead of adding a new column.

Strategy reuses the `Objective` type and the same per-user objectives list that card tags draw from. A Strategy entry and a card Objective are the same kind of record placed in two different slots. That choice avoided a second taxonomy and a second table. The cost is that the word "objectives" in the code can mean either slot, so the field name alone won't tell you which one is meant.

A few deliberate decisions shape how Strategy behaves:

- **It stays editable for the life of the deck.** It is not fixed when the deck is created, so the deck builder's creation flow has no Strategy step. You set and change it from the "Strategy:" row on the deck detail page.
- **One or two is guidance, not a rule.** Once two are set, the "Set Strategic Objective" menu shows the hint "Usually just 1-2 core objectives work best.", but it still lets you add a third. A deck with three genuine plans is unusual, not invalid.
- **It belongs to the deck, not to a version.** Versions don't snapshot Strategy. Every version of a deck shares the deck's current Strategy (see [below](#how-versions-change-objectives)).

## Objectives: your own tags, freeform on purpose

Objectives are the tags you apply by hand to individual cards. The assign menu labels them "Tag with Objective", and they're stored as a list of ids on each card entry (`DeckEntry.objectiveIds`). You create the labels yourself. Each has a name, a description and a color, and the list belongs to you, not to one deck.

Objectives are intentionally unconstrained. The app doesn't limit them to a fixed list, because their job is to record what only you know: which theme a card is in the deck for, or a note to yourself. The Objectives page describes them that way: "Your own tags for what a card does in your plan: themes like Aristocrats or Reanimation, or notes like Need to Buy." It also tells you that generic roles are detected automatically, so you don't need Objectives for those.

Older decks may still have Objectives named "Ramp" or "Removal" from before Card Roles existed. They keep working. They now just overlap with something the app works out for you, so you can delete them whenever you like.

> Note: the code comment on `Deck.objectives` in `src/types/index.ts` still describes `objectiveIds` as tagging "a card's mechanical role". That wording predates the Card Roles split. The current meaning is the one on this page.

## Card Roles: detected, never stored

Card Roles are the app's own "what this card does" labels: Ramp, Card draw, Removal, Board wipes, Tutor, Counterspell, Recursion and Protection. They come from `detectCardRoles()` in `src/features/recommendations/utils/deckSignals.ts`, which matches patterns against each card's oracle text every time it's needed. Nothing is saved. The full list and the matching rules are in [Card Roles](../reference/card-roles.md).

There are two reasons to compute roles instead of storing them.

- **No busywork.** Whether a card destroys a creature or adds mana is printed on the card. Asking you to tag it by hand would be copying something the app can already read. Every untagged card would also look like a gap.
- **No stale tags.** A stored tag is only as good as the last time someone updated it. A detected role is always consistent with the card's current text and with the rest of the app. The gallery badges, the deck builder's stats panel and the Suggestions tab all use the same detection, so they can't disagree about how much ramp a deck has.

The trade-off is accuracy. Pattern-matching rules text can miss unusually worded cards and can over-match others, and there's currently no way to override a detected role. That's acceptable because the stakes are low: a role is a hint about the deck, not a record you're relying on. The product owner judged a few misfires cheaper than asking people to keep a hundred tags up to date.

Card Roles are also kept visually separate. In the gallery they appear as neutral badges, so they read as facts about the card, while Objectives keep their colored pills. The filter panel has separate "Card Roles" and "Objectives" groups. In this app's wording, Objectives are never called "roles".

## How the three combine

Each layer answers a different question, and together they describe the deck:

- **Strategy** is the intent. It's what the deck is supposed to be doing.
- **Objectives** are your judgement about which cards serve that intent and why.
- **Card Roles** are the deck's skeleton: the ramp, draw and interaction any Commander deck needs, whatever its plan.

The split exists so the deck can eventually be checked against its own plan: "Do the cards actually pull toward the deck's strategy?" The app doesn't have a coherence check like that yet. Today the three layers meet in a few specific places:

- **Suggestions use all three.** The suggestions engine counts the four core Card Roles (ramp, draw, removal, board wipes) against rough targets. When a deck falls short, the shortfall becomes a reason to suggest cards, shown in a form like "Ramp: deck has 6 (aim ~10)". Strategy and Objectives feed in as well. Each Strategy label, and each card Objective used on at least three cards, is matched against the engine's known themes and boosts suggestions for that theme. Strategy counts for more than a card tag. A single stray tag isn't treated as a deck priority. For the details, see [How card suggestions work](how-suggestions-work.md).
- **The hand simulator keeps them apart.** Its top bar shows the "Deck Strategy" for context. The "Objectives Encountered" panel tracks the Objectives on the cards you've drawn, not the deck's Strategy.
- **The gallery shows both card-level layers.** You can filter by Card Role, by Objective, or by "Untagged".

This is also why Objectives match themes by label. An Objective named "Aristocrats" can only influence suggestions if its label matches a theme the engine knows. Freeform labels keep Objectives flexible. The cost is that the app understands only the ones that happen to match.

## How versions change Objectives

A [deck version](how-deck-versions-work.md) is a saved set of card swaps applied on top of the main deck. Objectives can differ per version, while Strategy can't.

Each version can carry **objective overrides**: for a given card, the list of Objectives that card has in this version. When you tag or untag cards while a version is selected on the deck detail page, the change goes into that version's overrides, not into the main deck. When the app shows a version, it starts from the main deck, applies the swaps, then replaces the Objectives on any card that has an override. That includes cards that weren't swapped. A card that a swap brings in starts with no Objectives unless the version has an override for it.

This follows from what versions are for. Trying a different build often changes why a card is there. In a more aggressive version, the same card might serve a different theme. So per-card intent, your Objectives, can vary per version.

Strategy, by contrast, describes the deck as a whole. The product owner decided that a deck has a single current Strategy shared by all its versions. That's why version comparison doesn't compare Strategy. The Strategy row always edits the main deck, whichever version is selected.

Card Roles never differ by version. They're recalculated from whichever cards are in the deck being shown.

## Related

- [Tag cards and set a deck strategy](../how-to/tag-cards-and-set-strategy.md): the task-level steps.
- [Card Roles](../reference/card-roles.md): every role and what it matches.
- [How deck versions work](how-deck-versions-work.md)
- [How card suggestions work](how-suggestions-work.md)
