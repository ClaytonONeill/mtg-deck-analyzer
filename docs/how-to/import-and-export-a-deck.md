# Import and export a deck

Move a deck out of the app as a file, or bring a previously exported JSON deck back in.

## Goal

Use this guide to back up a deck, share it, paste its list into another deckbuilding site, or restore a deck from a JSON file. It assumes you already have a deck in the app. If you don't, start with [Build your first Commander deck](../tutorials/build-your-first-deck.md).

## Export a deck

1. From the home page, open the deck.
2. In the version dropdown next to the **Export** button, choose the build to export: the main build or a saved version. Whatever is selected is exported, with that version's swaps applied. A version's export uses the deck name with the version name in parentheses after it, for example `Atraxa (Budget)`.
3. Select **Export**. The **Export Deck** dialog opens and shows the build it will export under **Exporting**.
4. Under **Format**, choose one:
   - **JSON**: the full deck record. This is the only format the app can import again, so use it for backups and moving decks between accounts.
   - **Excel (.xlsx)**: one row per card, with quantity, name, category, type line, mana cost, mana value, and color identity. Use it for spreadsheets and printing.
   - **Text List**: `quantity card name` lines, with commanders under a `Commander` header and the rest under `Deck`. Use it to paste the list into other deckbuilding sites.
5. Optional: edit **File name**. It defaults to the deck name with spaces replaced by underscores, and the extension follows the format you pick.
6. Optional: under **Save to**, select **Browse** to pick a folder. The **Browse** button appears only in browsers that support choosing a folder. Otherwise the file goes to your default downloads folder.
7. Select **Export**.

If you chose **Text List** and only need the list on your clipboard, select **Copy** instead of **Export**. The button changes to **Copied!** when the copy succeeds.

The dialog closes when the file is saved. If saving fails, the dialog stays open and shows "Failed to export deck. Please try again."

For what each file contains, see [Deck file formats](../reference/deck-file-formats.md).

## Import a deck

Import reads JSON files only, meaning files exported with the **JSON** format above.

1. Select **+ New Deck** in the header. The deck builder opens for a new deck.
2. In the bar at the top of the builder, select **Import Deck**. The button appears only for a new deck, not when you edit an existing one.
3. Choose the `.json` file. The button shows **Importing...** while the file is read.
4. If the file's deck ID already matches a deck in your library, the **Deck Already Exists** dialog asks what to do:
   - **Overwrite existing deck**: replace your current deck with the file's contents.
   - **Keep both (imported copy renamed)**: save the file as a new deck with a new ID, named `<deck name> (imported)`.
   - **Cancel**: import nothing.

When the import succeeds, the deck is saved to your library and its deck page opens.

## If the import fails

The error appears in red under **Import Deck**. The most common messages are:

- **"Could not parse file. Make sure it is a valid deck JSON."** The file is not valid JSON. This happens, for example, when you choose an `.xlsx` or Text List export.
- **"Invalid deck file — missing required fields."** The file is JSON but lacks a string `id`, `name`, `createdAt` or `updatedAt`, or an `entries` array.

The app can also reject a file with "Invalid deck file — Commander decks can only contain one copy of: …" when the file lists a card more than once that isn't exempt from the singleton rule. It shows "Failed to save imported deck." when saving fails after you choose an option in the **Deck Already Exists** dialog.

For other causes and fixes, see [Troubleshooting](../troubleshooting.md).

## Next steps

- [Deck file formats](../reference/deck-file-formats.md): the exact contents of the JSON, Excel, and Text List files.
- [Manage deck versions](manage-deck-versions.md): create the versions you can choose between when you export.
- [Troubleshooting](../troubleshooting.md)
