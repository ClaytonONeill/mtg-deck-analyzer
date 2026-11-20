# Deck file formats

This page specifies the three deck export formats (JSON, Excel, and text) and the JSON schema that **Import Deck** accepts.

For the steps to import or export a deck, see [Import and export a deck](../how-to/import-and-export-a-deck.md). For how decks are stored, see [Data model](data-model.md).

Source: `src/store/deckStore.ts` (`defaultExportFilename`, `buildDeckTextExport`, `buildDeckExportBlob`, `buildDeckXlsxBlob`, `importDeckFromFile`, `isValidDeck`, `findDuplicateCardNames`) and `src/types/index.ts`.

## Format summary

| Format | "Export Deck" **Format** button | Extension | MIME type | Importable |
| --- | --- | --- | --- | --- |
| JSON | "JSON" | `.json` | `application/json` | Yes |
| Excel | "Excel (.xlsx)" | `.xlsx` | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` | No |
| Text | "Text List" | `.txt` | `text/plain` | No |

The import file picker accepts `.json` files only.

## Default filenames

The default filename is the deck name with each run of whitespace replaced by one underscore, then `.` and the format extension:

```text
<deck name, whitespace → "_">.<json | xlsx | txt>
```

| Deck name | Format | Default filename |
| --- | --- | --- |
| `Atraxa Superfriends` | JSON | `Atraxa_Superfriends.json` |
| `Atraxa Superfriends` | Text | `Atraxa_Superfriends.txt` |

Other characters are not changed. The **File name** field is editable. Switching format replaces a trailing `.json`, `.xlsx`, or `.txt` (case-insensitive) with the new extension.

### Exporting a version

On the deck detail page, exporting while a saved version is active exports the version applied to the deck. Its `name` becomes `<deck name> (<version label>)`, and the default filename is built from that name. All other top-level fields, including `id` and `versions`, are those of the deck.

## JSON

### Export

The JSON export is the full `Deck` object, written with `JSON.stringify(deck, null, 2)` (two-space indent). No fields are added, removed, or renamed. Fields that are `undefined` in memory are omitted from the file.

### `Deck` (top level)

| Field | Type | Checked on import | Description |
| --- | --- | --- | --- |
| `id` | string | Yes | Deck identifier. Used to detect an existing deck on import. |
| `name` | string | Yes | Deck name. |
| `commander` | `ScryfallCard` or `null` | No | The commander. |
| `partner` | `ScryfallCard` or `null` | No | The partner commander. |
| `colorIdentity` | string[] | No | Combined color identity, letters from `W`, `U`, `B`, `R`, `G`. |
| `entries` | `DeckEntry[]` | Yes (must be an array) | The cards in the deck, excluding commander and partner. |
| `createdAt` | string | Yes | ISO 8601 timestamp. |
| `updatedAt` | string | Yes | ISO 8601 timestamp. Replaced with the current time when the deck is saved. |
| `objectives` | `Objective[]` | No | The deck's Strategy (its 1–2 core plans). |
| `versions` | `DeckVersion[]` | No | Saved deck versions. |

### `DeckEntry`

| Field | Type | Description |
| --- | --- | --- |
| `card` | `ScryfallCard` | The card. |
| `quantity` | number | Number of copies. |
| `category` | `CardCategory` | One of `Commander`, `Creature`, `Land`, `Instant`, `Sorcery`, `Enchantment`, `Artifact`, `Planeswalker`, `Other`. |
| `objectiveIds` | string[] | IDs of the user's Objectives tagged on this card. |
| `type_line` | string (optional) | Card type line. |

### `DeckVersion`

| Field | Type | Description |
| --- | --- | --- |
| `id` | string | Version identifier. |
| `name` | string | Version name. |
| `note` | string | Version note. |
| `swaps` | `{ removeCardId: string; addCard: ScryfallCard }[]` | Cards swapped out (by Scryfall card `id`) and in. |
| `objectiveOverrides` | `{ cardId: string; objectiveIds: string[] }[]` | Objectives for swapped-in cards, by Scryfall card `id`. |
| `createdAt` | string | ISO 8601 timestamp. |

### `Objective`

| Field | Type | Description |
| --- | --- | --- |
| `id` | string | Objective identifier. |
| `label` | string | Display label. |
| `description` | string | Description. |
| `color` | string | Display color. |
| `createdAt` | string | ISO 8601 timestamp. |

### `ScryfallCard`

Cards are stored as a subset of the Scryfall card object.

| Field | Type | Required in type |
| --- | --- | --- |
| `id` | string | Yes |
| `name` | string | Yes |
| `mana_cost` | string | Yes |
| `cmc` | number | Yes |
| `type_line` | string | Yes |
| `oracle_text` | string | Yes |
| `color_identity` | string[] | Yes |
| `colors` | string[] | Yes |
| `legalities` | `Record<string, string>` | Yes |
| `power`, `toughness` | string | No |
| `keywords` | string[] | No |
| `image_uris` | `{ small, normal, large, art_crop? }` (strings) | No |
| `card_faces` | `{ name, mana_cost, type_line?, oracle_text?, power?, toughness?, image_uris? }[]` | No |
| `prices` | `{ usd, usd_foil, usd_etched, eur, eur_foil, tix }` (string or `null`) | No |

### Import validation

`importDeckFromFile` reads the file as text and applies these checks in order. The first failure rejects the file with the message shown.

| Check | Error message |
| --- | --- |
| File cannot be read | `Failed to read file.` |
| Contents are not valid JSON | `Could not parse file. Make sure it is a valid deck JSON.` |
| Top level is not an object, or `id`, `name`, `createdAt`, `updatedAt` is not a string, or `entries` is not an array | `Invalid deck file — missing required fields.` |
| A card name appears more than once (see below) | `Invalid deck file — Commander decks can only contain one copy of: <names>.` |

No other fields are validated. Nested objects (`DeckEntry`, `DeckVersion`, `Objective`, `ScryfallCard`) are not type-checked, and the parsed object is used as-is.

#### Duplicate-card rejection

`findDuplicateCardNames` counts copies by card `name` (not Scryfall `id`) across:

- `commander` (1 copy)
- `partner` (1 copy)
- each `entries[i].card`, counting `entries[i].quantity` copies (1 if `quantity` is missing)

A name with a total above 1 is a duplicate. One entry with `quantity` greater than 1 is a duplicate. `versions[].swaps` are not counted.

These cards are exempt and never counted:

- cards whose `type_line` contains the word `Basic`
- cards whose `oracle_text` contains `a deck can have any number of cards named` (case-insensitive)

Entries with no `card` or no `card.name` are skipped.

#### After validation

| Condition | Result |
| --- | --- |
| No deck in the library has the file's `id` | The deck is saved as-is. |
| A deck with the same `id` exists | A "Deck Already Exists" dialog offers "Overwrite existing deck", "Keep both (imported copy renamed)", and "Cancel". |
| "Overwrite existing deck" | The imported deck replaces the existing deck with that `id`. |
| "Keep both" | The imported deck is saved with a new random `id` and the name `<name> (imported)`. |

### Minimal JSON example

This file passes every import check. It includes every top-level `Deck` field. Only `id`, `name`, `createdAt`, `updatedAt`, and `entries` are checked, but the app reads the other fields once the deck is loaded.

```json
{
  "id": "6f1c2a9e-0000-4000-8000-000000000001",
  "name": "Example Deck",
  "commander": null,
  "partner": null,
  "colorIdentity": [],
  "entries": [
    {
      "card": {
        "id": "00000000-0000-4000-8000-0000000000aa",
        "name": "Sol Ring",
        "mana_cost": "{1}",
        "cmc": 1,
        "type_line": "Artifact",
        "oracle_text": "{T}: Add {C}{C}.",
        "color_identity": [],
        "colors": [],
        "legalities": { "commander": "legal" }
      },
      "quantity": 1,
      "category": "Artifact",
      "objectiveIds": []
    }
  ],
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-01-01T00:00:00.000Z",
  "objectives": [],
  "versions": []
}
```

## Text

The text export is also what the "Copy" button copies to the clipboard. That button appears only when the "Text List" format is selected.

### Layout

Lines are joined with `\n` (LF). There is no trailing newline.

When the deck has a commander or partner:

```text
Commander
1 <commander name>
1 <partner name>

Deck
<quantity> <card name>
<quantity> <card name>
...
```

- The `Commander` header is followed by the commander, then the partner, each present only if set.
- One blank line separates the sections.
- The `Deck` header is followed by one line per `entries` item, in `entries` order.

When the deck has neither commander nor partner, there are no headers or blank line. The output is only the `<quantity> <card name>` lines.

Each card line is the entry's `quantity`, one space, and `card.name`. Set codes, collector numbers, categories, and Objectives are not included.

### Example

```text
Commander
1 Atraxa, Praetors' Voice

Deck
1 Sol Ring
10 Forest
```

## Excel (.xlsx)

### Workbook

| Property | Value |
| --- | --- |
| Sheets | One, named `Deck` |
| Header row | Row 1, the column names below |
| Data rows | One per card row, starting at row 2 |

### Row order

1. Commander, if set
2. Partner, if set
3. Each `entries` item, in `entries` order

### Columns

| Column | Value |
| --- | --- |
| `Quantity` | `1` for commander and partner, otherwise the entry's `quantity` |
| `Name` | `card.name` |
| `Category` | `Commander` for commander and partner, otherwise the entry's `category` |
| `Type Line` | `card.type_line` |
| `Mana Cost` | `card.mana_cost`, in Scryfall notation (for example `{2}{G}{U}`) |
| `CMC` | `card.cmc` |
| `Color Identity` | `card.color_identity` joined with no separator (for example `GU`; empty for colorless) |

Objectives, Strategy, versions, prices, and images are not included.
