# Build your first Commander deck

In this tutorial you sign in, build a small mono-green Commander deck, save it, and read its charts on the **Metrics** tab.

## Introduction

You will build a starter deck called **Ezuri Elves**. It is led by **Ezuri, Renegade Leader**, a green legendary Elf. By the end you will have:

- a saved deck with Ezuri as its commander
- ten green cards and ten Forests in it
- a deck page that shows your card types, mana curve, and color demand

The deck won't be finished. A Commander deck has 100 cards, and yours will have 21. That's enough to learn the main idea of the deck builder: **your commander's colors decide which cards the deck can hold.**

## Prerequisites

- A web browser.
- The address of the MTG Deck Analyzer app.

> TODO(product owner): confirm the production URL users should open, and whether anyone can sign up or accounts are invite-only.

## Step 1: Sign in

1. Open the app. You see the **MTG Deck Analyzer** sign-in card with "Welcome Back" under the title.
2. If you already have an account, enter your **Email Address** and **Password**, then click **Sign In**.
3. If you don't have an account:
   1. Click **Don't have an account? Sign up**.
   2. Enter your email address and a password, then click **Create Account**.
   3. The app shows "Check your email to confirm your account." Open the email and confirm.
   4. Return to the app, click **← Back to sign in**, and sign in.

You are now on the home page. If you have no decks yet, it says **Your library awaits**.

## Step 2: Start a new deck and name it

1. Click **Build Your First Deck**. If you already have decks, click **+ New Deck** in the header instead.
2. In the **Deck Identity** box ("Name your masterpiece..."), type:

   ```text
   Ezuri Elves
   ```

The deck builder now shows a **Commander** search box. On the right, or above the decklist on a phone, the **Deck at a Glance** panel shows `0 / 100`.

## Step 3: Set the commander

1. Click the **Commander** search box ("Find a legend...") and type:

   ```text
   Ezuri
   ```

   Results appear after you type three letters and pause briefly. This box only lists cards that can be a commander.
2. Click **Ezuri, Renegade Leader** in the list. Several cards are named Ezuri, so check the full name and the single green pip.

A card for Ezuri appears under the search box, with its type line and a green color pip. The counter now reads `1 / 100`. A new search box labeled **The 99** appears below. This is where the rest of the deck goes.

## Step 4: Add ten cards

Add each card below. Type its name into **The 99** ("Search cards..."), then click the result whose name matches exactly. The box clears after each card, so you can type the next name right away.

```text
Llanowar Elves
Elvish Mystic
Fyndhorn Elves
Elvish Visionary
Heritage Druid
Elvish Archdruid
Priest of Titania
Cultivate
Beast Within
Craterhoof Behemoth
```

Each card appears in the decklist under the builder. When you're done, the counter reads `11 / 100`. The status text in the top bar says **All changes saved**, because the builder saves each card as you add it once the deck has a name.

Now try adding a card in a color Ezuri doesn't have. Search for `Lightning Bolt` and click it. Instead of being added, you'll see a warning:

> Lightning Bolt is outside your commander's color identity and cannot be added.

Your commander's color identity is green, so red cards aren't legal in this deck. Close the warning with its **X** button. The full rules are in [Commander deck rules](../reference/deck-rules.md).

## Step 5: Add basic lands

Scroll to the **Basic Lands** panel under The 99. It only shows basic lands in your commander's colors, so the only one here is **Forest**.

Click the **+** button next to Forest ten times. The number between **−** and **+** goes up to `10`.

The counter now reads `21 / 100`. In **Deck at a Glance**, the **Lands** figure shows `10`, with the hint "36–38 typical". That's the usual land count for a full deck. You don't need to reach it for this tutorial.

## Step 6: Save the deck

Click **Save Deck** in the top bar. The button only works once the deck has a name.

The app saves the deck and takes you back to the home page. Under **Your Decks** there's now an **Ezuri Elves** card.

## Step 7: Open the deck and read the Metrics tab

1. On the **Ezuri Elves** card, click **View**.
2. The deck page opens with **Ezuri Elves**, a green pip, and "Commander: Ezuri, Renegade Leader". The **Metrics** tab is already selected.

Look at the three parts of the Metrics tab:

- **Card Types**: the **Types** view is selected first. The chart splits your cards by type, so you see creatures, a few spells, and your Forests. **Include Lands** is on by default.
- **Mana Curve**: click **Mana Curve**. The chart now groups cards by mana value, the total mana each one costs. Most of this deck costs one or three mana, and Craterhoof Behemoth stands alone at eight. With **Include Lands** on, your Forests show up at zero.
- **Color Demand**: below the chart, a single **Green** tile shows `100%`. This panel counts the colored mana symbols (pips) in your cards' costs. Every pip in this deck is green, which is why Forests are the right lands for it.

## What you've built

You now have a saved, legal Commander deck:

- **Ezuri, Renegade Leader** is the commander, and the deck's color identity is green.
- It has ten green cards and ten Forests, 21 cards counting the commander.
- The builder refused an off-color card.
- The Metrics tab shows the deck's card types, its mana curve, and its color demand.

To keep building, go back to the home page and click **Edit** on the deck card, or click **Edit Deck** on the deck page.

## Next steps

- Keep going with [Tune a deck with objectives and versions](tune-a-deck-with-versions.md). It picks up with this deck.
- Already have a decklist somewhere else? See [Import and export a deck](../how-to/import-and-export-a-deck.md).
- For the exact legality rules (color identity, singleton, partners, card count), see [Commander deck rules](../reference/deck-rules.md).
- For every screen and tab in the app, see [Screens and tabs](../reference/screens-and-tabs.md).
