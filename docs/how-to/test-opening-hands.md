# Test opening hands in the simulator

Draw sample hands from a deck and play out the first few turns to check that the deck can make its land drops and cast its early spells.

## Goal

By the end you will have drawn a 7-card hand, played lands, cast spells and your commander, and passed a few turns. You will also have read which of your Objectives and which Strategy showed up. Use this guide after changing a deck's mana base or curve, or to compare two versions. It assumes you know Commander's turn structure and already have a deck built.

## Prerequisites

- A saved deck with a commander and cards. See [Build your first Commander deck](../tutorials/build-your-first-deck.md).
- Optional: Objectives tagged on cards and a Strategy set on the deck. Without them the simulator still works, but its Objectives panel stays empty. See [Tag cards and set a deck strategy](tag-cards-and-set-strategy.md).

## Steps

### 1. Open the simulator for the deck or version you want to test

1. Open the deck, then select the **Simulator** tab.
2. If the deck has saved versions, pick one in the version selector first. The simulator uses the deck list of the version you pick.

The tab opens on turn 1 with 7 cards from the shuffled deck already in your hand. Your commander and partner are not shuffled in. They sit in the command zone, in the left-hand column below the library and graveyard.

> Switching versions or leaving the Simulator tab throws away the current game. When you come back, a new one starts on turn 1.

### 2. Redraw the hand if you want a different one

- **↺ Reset** shuffles the whole deck again, deals a new 7-card hand and goes back to turn 1. It also clears the battlefield, the graveyard and the Objectives counts.
- **Discard Hand** puts your current hand in the graveyard and draws the next 7 cards from the library. The library is not reshuffled and the turn stays the same. The Objectives counts keep adding up from earlier hands.

Use **↺ Reset** to try a new opening hand. Use **Discard Hand** only if you want to keep the game going and look at the next 7 cards.

### 3. Play a land

1. Click a land in your hand. A panel pops up at the bottom of the screen showing that card.
2. Click **Play Land**.

The land moves to the **Battlefield** and its mana appears under **Mana Available** in the top bar, broken down by color. You can play one land per turn. After that the button reads **Land already played this turn** until you start the next turn.

### 4. Cast a spell

1. Click a nonland card in your hand.
2. Click **Cast (*cost*)**.

The button is disabled when your untapped mana sources can't pay the cost. If you can pay, the simulator taps the sources for you. Creatures, artifacts, enchantments, planeswalkers and battles go to the **Battlefield**. Instants and sorceries go to the graveyard.

Mana rocks and mana dorks you cast also produce mana. A creature you cast this turn shows a **Zzz** badge and can't tap for mana until your next turn. Artifacts can tap for mana right away.

If a cast fails, a red message explains why, for example `Not enough mana available to cast …` or that {X} spells aren't supported. Dismiss it with **✕**.

### 5. Cast your commander from the command zone

1. Click your commander's card in the left-hand column.
2. Click **Cast Commander (*cost*)**.

Commander tax is added to the cost: {2} more for each earlier cast from the command zone. Once your commander resolves, the command-zone card is grayed out with an **In Play** badge, and the card also appears on the **Battlefield**. Nothing in the simulator sends a commander back to the command zone, so in practice you cast it once per game and the tax stays at +0. If the deck has a partner, it has its own card and button in the same column and its own tax count.

### 6. Pass the turn, or draw an extra card

- **Next Turn** moves the turn counter up by one, untaps all your permanents, lets you play another land and draws one card.
- To draw a card without passing the turn, click the face-down library at the top of the left-hand column. Use this when you're playing out a draw spell. It doesn't untap anything or move the turn counter.

The **N CARDS** badge next to **Auto Discard** shows how many cards are left in the library.

**Hand size.** If you have more than 7 cards when you click **Next Turn**, the turn doesn't advance. A warning reads `Hand size is over 7 — discard down to end your turn.` and every card in your hand gets a **DISCARD** overlay. Click cards to discard them until you're down to 7, then click **Next Turn** again.

To skip that step, turn on **Auto Discard**. Whenever you draw with 7 or more cards in hand, the card you have held longest is discarded automatically, and a notice tells you which card it was.

### 7. Read the Objectives and Strategy for the hand

- **Deck Strategy** in the top bar lists the deck's Strategy (its one or two plans). It shows only when the deck has a Strategy set, and it is hidden on phone-width screens.
- **Objectives Encountered** at the bottom of the tab shows each of your Objectives that appeared on at least one drawn card. Next to each is a count and a bar that compares it to the most common Objective. Counts include every card drawn this game, including hands you replaced with **Discard Hand**. They don't go down when a card leaves your hand.
- Clicking a card shows that card's Objectives at the bottom of its pop-up panel.

To hide an Objective, click it. Hidden ones stay in the grid but are grayed out and struck through. To show them again, click **Show all (*N* hidden)**, which doesn't change your game. **↺ Reset** also shows all hidden Objectives again, but it starts a new game.

The simulator does not show auto-detected Card Roles such as ramp or draw. For those, use the Gallery and Metrics tabs. See [Card Roles](../reference/card-roles.md).

## Final Result

You've done this right if you can play a land each turn, see **Mana Available** go up, and cast cards and your commander with the **Cast** buttons. If a **Cast** button is disabled when you expect to have enough mana, look through the limits below before you assume the deck is short on mana.

## What the simulator does not model yet

- **Statistics across many hands.** There is no "run N hands" summary. Each game is one hand you play by hand.
- **Mana abilities are guessed from rules text.** Only `{T}: Add …` abilities with no other cost are recognized. Sources with any extra cost, such as sacrificing the card or paying life (Chrome Mox, for example), produce no mana. Conditional abilities are simplified to the colors they mention. "Any color" sources such as Command Tower can make any of the five colors.
- **{X} spells can't be cast.**
- **Hybrid and Phyrexian mana** (`{W/U}`, `{R/P}`) only count as the first color listed.
- **Double-faced cards** cost nothing to cast and have no rules text, so a modal double-faced card with a land on the back doesn't produce mana. Tracked in [task 024](../../tasks/024-simulator-dfc-mana-cost-and-text.md).
- **No turn phases, combat, stack or instant-speed play.** Creatures stay on the battlefield, and clicking a permanent only shows the card. Nothing removes permanents or returns your commander to the command zone.
- **Every turn draws a card.** That includes turn 1, which gives you one more card than real Commander turn order.

The [simulator playability roadmap](../plans/simulator-playability-roadmap.md) tracks planned work.

## Next Steps

- [Card Roles](../reference/card-roles.md): the roles detected from rules text, which this tab doesn't show.
- [Strategy, Objectives, and Card Roles](../explanation/strategy-objectives-and-card-roles.md): how the three ideas differ.
- [Manage deck versions](manage-deck-versions.md): build a variant of the deck and then test it here.
- [Troubleshooting](../troubleshooting.md)
