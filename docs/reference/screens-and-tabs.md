# Screens and tabs

This page lists every route in the app, every tab on the Deck Detail page, and the controls on each.

Labels below are copied from the UI. For task-oriented steps, see the [how-to guides](#related-pages).

## Routes

Routing is defined in `src/App.tsx`. All routes are flat (no nesting) and require a signed-in user.

| Path | Page component | Purpose |
|---|---|---|
| `/` | `HomePage` | Deck library: browse, search, open, edit, and delete decks. |
| `/build` | `DeckBuilderPage` | Create a new deck. |
| `/build/:deckId` | `DeckBuilderPage` | Edit an existing deck's name, commander, partner, and cards. |
| `/deck/:deckId` | `DeckDetailPage` | View and tune one deck (versions, metrics, gallery, simulator, wishlist, suggestions). |
| `/wishlist` | `WishlistPage` | Cross-deck wishlist of cards. |
| `/objectives` | `ObjectivesPage` (file `src/pages/ObjetivesPage.tsx`) | Create, edit, and delete Objectives. |
| any other path | — | Redirects to `/` (replaces the history entry). |

### Signed-out and loading states

These apply to every route, before routing runs.

| State | Screen |
|---|---|
| Session still loading | Full-screen spinner with the text "Shuffling up...". |
| No signed-in user | `LoginPage`, whatever the URL. |

`LoginPage` has three views:

| View | Heading | Fields | Submit button | Links |
|---|---|---|---|---|
| Sign in | Welcome Back | Email Address, Password | Sign In | "Don't have an account? Sign up", "Forgot password?" |
| Sign up | Create Operative | Email Address, Password | Create Account | "← Back to sign in" |
| Forgot password | Initiate Recovery | Email Address | Send Reset Link | "← Back to sign in" |

In the Password field, pressing Enter submits the form.

## Header

`src/components/Header/Header.tsx`. It is shown on every route when the user is signed in.

| Control | Action | Visibility |
|---|---|---|
| Logo / "MTG Deck Analyzer" | Goes to `/`. | Always. |
| Objectives | Goes to `/objectives`. | Hidden on `/objectives`. |
| Wishlist | Goes to `/wishlist`. | Hidden on `/wishlist`. |
| + New Deck | Goes to `/build`. | Hidden on `/build` only. It still shows on `/build/:deckId`. |
| Sign Out | Signs out, then goes to `/`. | Always. |
| Theme picker (color-pip button, label "Choose theme") | Opens a list of themes. Picking one applies it. | Always. |
| Menu toggle (hamburger / X) | Opens or closes the mobile menu. | Below the `md` breakpoint only. |

Below the `md` breakpoint, the Objectives, Wishlist, + New Deck, and Sign Out buttons move into the hamburger menu. The theme picker stays in the bar. Picking a destination closes the menu.

The theme picker lists 18 daisyUI themes in this order: arcane, grimoire, dark, light, emerald, fantasy, retro, nord, cupcake, bumblebee, pastel, valentine, halloween, garden, forest, dracula, business, night. The active theme is highlighted. See [Design tokens](design-tokens.md).

## Home (`/`)

`src/pages/HomePage.tsx`.

| Element | Description |
|---|---|
| Empty state | Shown when the user has no decks: "Your library awaits" and the button **Build Your First Deck** (goes to `/build`). |
| Heading | "Your Decks" with a count. While filtering, the count reads "*n* of *total*". |
| Search box | Placeholder "Search decks or commanders". Matches deck and commander names. |
| Color filter | Toggle buttons for W, U, B, R, G, and C (colorless). You can select more than one. |
| Sort select | Recently edited (default), Newest, Name (A–Z), Most complete. The choice is saved in `localStorage` (`home-deck-sort`). |
| No-match state | "No decks match those filters." with a **Clear filters** button. |

Search text and color filters are not saved. They reset when you leave the page.

### Deck tile

| Element | Description |
|---|---|
| Commander art | Opens the deck (`/deck/:deckId`). |
| Name, color pips, commander (and partner) | Read-only. |
| Progress | Card count out of 100. |
| Strategy pills | The deck's strategy objectives, if any. |
| Meta line | "Edited *time ago*", the version count, and an approximate deck value (from prices saved when cards were added). |
| View | Opens `/deck/:deckId`. |
| Edit | Opens `/build/:deckId`. |
| X (label "Delete Deck") | Opens a delete confirmation. If the delete fails, the tile returns and an error alert appears. |

## Deck Builder (`/build`, `/build/:deckId`)

`src/pages/DeckBuilderPage.tsx`.

### Top bar

| Control | Description |
|---|---|
| Save status | Shows one of: "Name your deck to autosave cards", "Saving...", "All changes saved", or "Couldn't save your last change." with a **Retry** link. |
| Import Deck | Only on `/build` (new deck). Accepts a `.json` file. If a deck with the same name already exists, a "Deck Already Exists" dialog offers **Overwrite existing deck**, **Keep both (imported copy renamed)**, and **Cancel**. A successful import goes to `/deck/:deckId`. See [Deck file formats](deck-file-formats.md). |
| Save Deck | Saves, then goes to `/`. Disabled until the deck has a name. |

### Builder controls

| Section | Description |
|---|---|
| Deck Identity | Deck name input (placeholder "Name your masterpiece..."). |
| Commander | Card search limited to commanders (placeholder "Find a legend..."). The selected commander shows as a card with its color identity. |
| Partner Commander / Required Partner: *name* | Shown only when the commander allows a partner. Includes a partner search, an error alert for invalid partners, and an ✕ button to remove the partner. See [Commander deck rules](deck-rules.md). |
| The 99 | Card search (placeholder "Search cards..."). Shown once a commander is set. Disabled at 100 cards. Off-color and duplicate cards show a dismissible alert instead of being added. |
| Basic Lands | Controls for adding basic lands. Disabled at 100 cards. |
| Deck at a Glance | Sidebar stats: Lands, Avg MV (nonland), Price, a mana curve, and Card Role counts against target values ("Detected from card text. Targets are rough Commander norms."). |
| Decklist | The deck's cards, with a **List** / **Stacks** view toggle and a remove button on each card. Empty text: "No cards yet. Search above to start adding to the 99." |

## Deck Detail (`/deck/:deckId`)

`src/pages/DeckDetailPage.tsx`.

| State | Screen |
|---|---|
| Loading | Spinner with the text "Scanning the multiverse...". |
| Deck not found or failed to load | The error text and a **Go home** button. |

### Page bar

| Control | Action |
|---|---|
| Back | Goes to `/`. |
| Edit Deck | Goes to `/build/:deckId`. |

### Deck identity block

| Element | Description |
|---|---|
| Name and color pips | Read-only. |
| Commander / Partner | Card names. Shows "None set" when there is no commander. |
| Strategy | The deck's strategy objectives as pills, each with a remove control. The **+** dropdown ("Set Strategic Objective") lists Objectives not yet assigned. Once two are set, it adds the hint "Usually just 1-2 core objectives work best." With none set, it shows "No strategic objective set". See [Strategy, Objectives, and Card Roles](../explanation/strategy-objectives-and-card-roles.md). |
| Card count | "*n* / 100 cards" with a progress bar. The count highlights at exactly 100. |

### Version selector

The "Viewing" bar controls which build every tab shows.

| Control | Description |
|---|---|
| Version select | Options are "Main — *deck name*" followed by each saved version by name. Changing it re-renders all tabs for that version. |
| Export | Opens the Export Deck dialog for the selected build (see [Export Deck dialog](#export-deck-dialog)). |
| Set as Main | Only when a version is selected. Confirms "Set "*name*" as the main build?" ("This replaces the current main deck list. This action cannot be undone."). After confirming, a second dialog offers **Delete Version** or **Keep Version** for the merged version. |
| Delete Version | Only when a version is selected. Asks for confirmation, then deletes. If that version was selected, the view returns to Main. |

You can't rename a saved version, edit its note, or remove a single swap from it in the UI. See [tasks/007](../../tasks/007-deck-version-editing-gaps.md) and [How deck versions work](../explanation/how-deck-versions-work.md).

### Tabs

| Tab label | Content component |
|---|---|
| Metrics (default) | Charts and version compare |
| Gallery | `CardGallery` |
| Simulator | `HandSimulator` |
| Deck Wishlist | `WishlistDeckFilter` |
| Suggestions | `RecommendationsPanel` |

On desktop (`md` and up), tabs show as a bordered tab bar. Below `md`, they show as a horizontally scrollable row of pills.

### Metrics tab

| Control | Description |
|---|---|
| Types / Mana Curve / Compare | Selects the view. Defaults to Types. |
| Include Lands | Toggle, on by default. It is hidden in Compare. |
| Stacked / Individual | Bar layout for the color series. Defaults to Stacked. It is hidden in Compare. |

**Types** and **Mana Curve** show a "Card Types" or "Mana Curve" bar chart and a **Color Demand** grid (pip share per color). Clicking a bar opens a card list for that category ("*n* Cards Found", closed with **Close Inspector**). On touch devices (`hover: none`), the first tap selects a bar and shows "View *category* cards" and a "Clear selection" button. The hint text "Tap a bar for its color breakdown." appears there.

**Compare** (`src/features/deckVersions/components/VersionCompare.tsx`) shows two selectors, **Base** (default Main) and **Target** (defaults to the selected version, else the first version), with a ⇄ button that flips them. With no saved versions it shows a prompt to save one instead; with both sides the same, "Pick two different versions to compare." Otherwise it shows four summary tiles (Cards changed, Price change, Avg mana value, Lands) and three sub-tabs:

| Sub-tab | Contents |
|---|---|
| Swaps (default) | Out→in card pairs grouped by card type, paired by the main-deck card each replaces. Unpaired changes show "Nothing added" / "Nothing removed". Clicking a pair opens both cards full size; desktop hover shows a card preview. |
| Charts | **By Type** / **By Mana Value** toggle and **Include Lands** toggle. A head-to-head bar chart (Base muted, Target in the primary color), then each side's color-stacked chart on a shared y-axis. |
| Stats | Base / Target / Change tables: Overview, Card types, Card roles, Color demand, Objective tags. Empty sections are hidden. |

### Gallery tab

`src/features/gallery/components/CardGallery.tsx`. It shows the selected build's cards as images. Basic lands are excluded from the grid and from its counts.

#### Pending swaps banner

Shown when swaps are staged. It lists each "− *removed* → + *added*" swap with an **Undo** button, plus a **Save Changes** button that opens the Save Version dialog (see [Save Version dialog](#save-version-dialog)).

#### Search

Placeholder: `Search cards — "Sol Ring", "flying", "draw a card"`. It matches card name, type line, and rules text, including both faces of double-faced cards. Matching ignores case.

#### Sort

| Control | Values | Default |
|---|---|---|
| Sort by | Type, Color, Mana, Name, Price | Type |
| Direction button | Asc. / Desc. Picking a sort resets the direction to that sort's natural order: Price → Desc., all others → Asc. | Asc. |
| AND (then-by select) | None, or any sort key other than the primary one | None |

Type order is Creature, Instant, Sorcery, Enchantment, Artifact, Planeswalker, Land, Other.

#### Other toolbar controls

| Control | Description |
|---|---|
| Per row (1 / 2 / 3) | Mobile only (below `sm`). Sets cards per row. Default is 1. At 2 or 3, the tile controls get smaller and Card Role chips are hidden. |
| Inventory | "*shown* / *total*" card count. |
| Hide/Show Commander(s) | Only when the deck has a commander or partner. Toggles the commander row above the grid. |

#### Filters

The **Filters** button opens the filter panel. Its badge shows the number of active selections.

| Section | Options | Matching |
|---|---|---|
| Color Identity | The deck's colors plus C (colorless). It has its own **Clear** link. | A card passes if its color identity shares any selected color. C matches colorless cards. |
| Mana Value | Independent toggles 0, 1, 2, 3, 4, 5, 6, 7+. | A card passes if its mana value (rounded down, 7 and above grouped as 7+) is in any selected bucket. |
| Type | Creature, Instant, Sorcery, Enchantment, Artifact, Planeswalker, Land, Other | A card passes if its category is any selected type. |
| Card Roles ("detected from card text") | Only roles present in this deck, each with a card count. | A card passes if it has any selected role. See [Card Roles](card-roles.md). |
| Objectives ("your tags") | Only Objectives tagged on at least one card, each with a count, plus **Untagged**. With none tagged, the text "No cards tagged yet." appears. | A card passes if it has any selected Objective, or has no Objectives and Untagged is selected. |

Options within one section are combined with OR. Sections are combined with AND, and the search box is applied as well. **Clear All Filters** clears every filter section but leaves the search box alone. When nothing matches, the gallery shows "No cards match your search and filters." with **Clear search & filters**, which clears both.

#### Saved gallery settings

| Setting | Storage | Key | Scope |
|---|---|---|---|
| Sort | `localStorage` | `gallery-sort` | All decks, across visits |
| Then-by sort | `localStorage` | `gallery-then-by` | All decks, across visits |
| Direction | `localStorage` | `gallery-sort-dir` | All decks, across visits |
| Cards per row (mobile) | `localStorage` | `gallery-mobile-columns` | All decks, across visits |
| Search text | `sessionStorage` | `gallery-query:<deckId>` | Per deck, current browser session |
| Filters | `sessionStorage` | `gallery-filters:<deckId>` | Per deck, current browser session |

The filter panel's open or closed state and the commander-row visibility are not saved.

#### Card tile

| Control | Description |
|---|---|
| Card image | Opens an enlarged view. Navigate between cards with the ← / → arrow keys, the on-screen arrows (`sm` and up), or a horizontal swipe. Esc or a backdrop click closes it. Swapped-out cards don't open. |
| ×*n* badge | Shown when the quantity is greater than 1. |
| Card Role chips | Detected roles. These are read-only. |
| **+** | Objective assign menu, listing Objectives not yet on the card. On a version, the tag applies to that version. |
| ⇄ Swap | Opens the swap sidebar for this card. |
| Objective pills | Assigned Objectives. Each has a remove control. |
| Swapped Out overlay / Undo Swap | Shown on a card with a staged swap. Its replacement shows as "→ *name*". |

#### Swap sidebar

The sidebar is titled "Swapping Out *card name*". It has three tabs:

| Tab | Content |
|---|---|
| Search | Scryfall search (placeholder "Search Scryfall..."). |
| Wishlist (*n*) | Wishlist cards tagged to this deck. You can sort by Name or Price, filter by Card Type and Objectives, and use **Hide Swapped** and **Clear All**. |
| Suggested | Suggestions with two modes: **For *card name*** and **For the deck**. |

Cards outside the color identity, already in the deck, or already used in a swap are marked ILLEGAL, IN DECK, or SWAPPED. **Confirm Swap with *name*** stages the swap. Before you pick a card, the button reads "Select a replacement" and is disabled.

### Simulator tab

`src/features/simulator/components/HandSimulator.tsx`. It simulates draws and plays for the selected build. Switching versions restarts it at turn 1.

| Control / area | Description |
|---|---|
| Game Turn | The current turn number. |
| Deck Strategy | The deck's strategy pills, if any. |
| Mana Available | Untapped mana by color and in total, or "No mana sources up". |
| Next Turn | Advances a turn. Disabled while a discard is required. |
| ↺ Reset | Restarts the simulation. |
| Library (card back) | Click to draw a card. Shows "Empty" when the library is empty. |
| Graveyard | The top discarded card and a count, or "GY". |
| Command zone | The commander and partner. Click one to select it. A cast commander shows "In Play". |
| Auto Discard | Toggle. The library count appears next to it ("*n* CARDS"). |
| Discard Hand | Discards the whole hand. |
| Hand | Click a card to select it. When the hand is over 7, the alert "Hand size is over 7 — discard down to end your turn." appears and clicking a card discards it. |
| Battlefield | Permanents in play, lands first. Tapped cards are rotated. Creatures that entered this turn show "Zzz". |
| Selected card panel | **Play Land** (or "Land already played this turn"), **Cast (*cost*)**, or **Cast Commander (*cost* +*tax*)**, plus the card's Objectives. A commander already cast shows "Already cast this game — on the battlefield." |
| Objectives Encountered | Per-Objective counts of drawn cards. Click an Objective to hide or show it. **Show all (*n* hidden)** restores hidden Objectives. |

Known gaps: [tasks/019](../../tasks/019-simulator-objectives-reset.md) and [tasks/024](../../tasks/024-simulator-dfc-mana-cost-and-text.md). See [Test opening hands](../how-to/test-opening-hands.md).

### Deck Wishlist tab

`src/features/wishlist/components/WishlistDeckFilter.tsx`. It lists wishlist entries tagged to this deck under "*n* card(s) on wishlist". Each entry uses the same card component as the Wishlist page (see [Wishlist](#wishlist-wishlist)). With no tagged entries, it shows "No wishlist cards tagged here." The tab has no add, sort, or filter controls.

### Suggestions tab

`src/features/recommendations/components/RecommendationsPanel.tsx`. Suggestions are computed for the selected build. The title reads "Suggestions for Main" or "Suggestions for *version name*".

| Control / element | Description |
|---|---|
| Top picks / Hidden gems | Suggestion style. Defaults to Top picks. The choice is saved in `localStorage` (`recommendations-mode`). |
| Based on | The inputs used. |
| EDHREC notice | Shows one of three notices: a link to the commander's EDHREC page, a notice that no EDHREC data exists, or a notice that EDHREC couldn't be reached (with **Retry**). |
| Card grid | 8 suggestions at first. Click a card image to zoom it. |
| Wishlist / Wishlisted | Adds the card to the wishlist and tags it to this deck. Disabled once it is tagged. |
| Swap in | Opens a picker ("Pick the card it replaces.", with sections "Suggested to replace" and "Rest of the deck"). Picking a card stages a swap and shows "Staged: *in* in for *out*." with **Review in Gallery**. Disabled for cards already in the deck. |
| Add to deck / Already in deck | Adds the card to the main deck list immediately. Hidden when the deck has 100 cards (unless the card is already in it). |
| Show more (*n* left) | Shows 8 more. You can use it up to 3 times, after which the panel shows "That's the strongest set; beyond this, suggestions get noisy." |

See [Get card suggestions](../how-to/get-card-suggestions.md) and [How suggestions work](../explanation/how-suggestions-work.md).

### Dialogs and notices

#### Save Version dialog

Opened from **Save Changes** on the pending swaps banner.

| Viewing | Modes | Fields | Confirm button |
|---|---|---|---|
| Main | New version only | VERSION NAME (required), NOTE (OPTIONAL) | Save Version |
| A version | **Update "*name*"** appends the staged swaps to that version. **Branch as New** creates a new version from it. | Branch as New only: VERSION NAME, NOTE (OPTIONAL) | Update Version / Save Version |

#### Export Deck dialog

| Field | Values |
|---|---|
| Exporting | "Main Build" or the version name. |
| Format | JSON, Excel (.xlsx), Text List |
| File name | Free text. The placeholder shows the default name. |
| Save to | A folder chosen with **Browse** where the browser supports a directory picker. Otherwise the file goes to the default downloads folder. |
| Buttons | Cancel, Copy (Text List only), Export (disabled with an empty file name) |

See [Deck file formats](deck-file-formats.md).

#### Save error toast

If a deck save fails, the toast "Couldn't save your deck changes." appears with a **Retry** button.

## Wishlist (`/wishlist`)

`src/pages/WishlistPage.tsx`.

| Element | Description |
|---|---|
| Page bar | **Back** (goes to `/`), the title "Wishlist", and the entry count. |
| Add panel | Card search ("Search for a card to wishlist", placeholder "Type a card name..."). Selecting a card shows a preview with an optional note field ("WHY THIS CARD?") and the buttons **Cancel** and **Add to Wishlist**. |
| Sort By | Date Added (default), Name, Mana Value, Color Identity, Type, Price. Below `md` it is a select. On desktop it is a button group. |
| Direction | Asc. / Desc. Defaults to Desc. |
| AND (then-by select) | None, or another sort key. |
| Count | "SHOWING *n* / *total*". |
| Filters | Color Identity (W, U, B, R, G), Type, Objectives, In Decks (a deck checklist), and **Clear All Filters**. There are no Mana Value toggles or Card Roles on this page. |
| Entry card | A remove button, an Objectives section, and a Tagged Decks section with **+ Add to Deck** and an untag button for each deck. |

Sort and filter settings on this page are not saved. See [Use the wishlist](../how-to/use-the-wishlist.md).

## Objectives (`/objectives`)

`src/pages/ObjetivesPage.tsx` with `ObjectiveManager`.

| Section | Controls |
|---|---|
| New Objective | Quick picks (preset label and description; "Quick picks: these also improve card suggestions."), **Short Label** (max 20 characters, placeholder "e.g. Ramp"), **Description (Optional)**, and **Create Objective**. |
| Existing Objectives | Each Objective has **Edit** (inline label and description, with **Save** / **Cancel**) and **Delete**. When there are none, the list shows "No objectives defined yet." |

The page intro states that generic Card Roles (Ramp, Card Draw, Removal…) are detected automatically. See [Tag cards and set a deck strategy](../how-to/tag-cards-and-set-strategy.md).

## Related pages

- [Import and export a deck](../how-to/import-and-export-a-deck.md)
- [Set up partner commanders](../how-to/set-up-partner-commanders.md)
- [Tag cards and set a deck strategy](../how-to/tag-cards-and-set-strategy.md)
- [Manage deck versions](../how-to/manage-deck-versions.md)
- [Get card suggestions](../how-to/get-card-suggestions.md)
- [Test opening hands](../how-to/test-opening-hands.md)
- [Use the wishlist](../how-to/use-the-wishlist.md)
