# Set up partner commanders

This guide shows you how to add, change, or remove a second commander on a deck whose commander has Partner.

## Goal

Pair your commander with a partner in the deck builder, so the deck's color identity covers both cards. You can also swap that partner for another one or remove it. This guide assumes you can already create a deck and set its commander. If you can't, start with [Build your first Commander deck](../tutorials/build-your-first-deck.md).

## Prerequisites

- A deck whose commander has Partner. The app opens a partner slot only when the commander's rules text contains the word "partner". That covers both generic **Partner** and **Partner with [Name]**. Other pairing mechanics, such as "Choose a Background" or "Friends forever", don't open the slot. See [Deck rules](../reference/deck-rules.md) for the full pairing rules.

## Steps

### Open the deck in the builder

- For a new deck, start one from the home page, name it, and set the commander in the **Commander** search.
- For an existing deck, click **Edit** on its card on the home page, or **Edit Deck** on the deck's page.

When the commander has Partner, a second search box appears under the commander card.

### Add a partner

1. Find the second search box. Its label depends on the commander's keyword:
   - **Partner Commander**: the commander has generic Partner. Search for any legal commander that also has Partner.
   - **Required Partner: [Name]**: the commander has "Partner with". Search for the card that's named.
2. Pick the card from the results. Like the **Commander** search, this one only returns cards that can be commanders.
3. Check the partner card that appears below the search. It shows the partner's name, type line, price, and color pips.

If the app rejects the pick, a red alert gives the reason and the deck stays as it was:

- "[Commander] must partner with [Name]." You picked a different card than the one "Partner with" names.
- "[Card] does not have the Partner keyword and cannot pair with [Commander]." Your commander has generic Partner, and the card you picked doesn't.

Close the alert with **✕** and search again.

### Change the partner

Search the partner box again and pick a different card. The new card replaces the current partner, and the color identity is recalculated from the commander and the new partner.

### Remove the partner

Click the **✕** button on the partner card. The color identity goes back to the commander's colors alone.

If you replace the commander itself in the **Commander** search, the partner is removed too.

### Save the change

Click **Save Deck**. Autosave only runs when you add or remove cards in the 99, so a partner change on its own isn't stored until you save. Saving also takes you back to the home page.

## How a partner affects color identity

- **Adding a partner** sets the deck's color identity to every color from both commanders. For example, a white-blue commander with a black partner gives a white-blue-black deck. Cards in the partner's colors can now be added in **The 99**, and the basic lands panel offers the matching basics.
- **Removing or changing a partner** doesn't take any cards out of the deck. A card that was legal only because of the old partner stays in the 99, even though you couldn't add it now. Remove those cards yourself from the deck list.

## Final result

- The builder shows both commander cards. The home page deck card shows "[Commander] & [Partner]" and color pips for the combined identity.
- In **The 99** search, cards in the partner's colors are accepted. Before you added the partner, they were rejected with "[Card] is outside your commander's color identity and cannot be added."

## Next steps

- [Deck rules](../reference/deck-rules.md): the full pairing and color-identity rules.
- [Import and export a deck](import-and-export-a-deck.md): move a partnered deck in or out of the app.
