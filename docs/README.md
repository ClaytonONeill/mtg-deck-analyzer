# Documentation

This page indexes every page in the MTG Deck Analyzer docs, grouped by what you are trying to do.

**New here?** Start with [Build your first Commander deck](tutorials/build-your-first-deck.md).

## Tutorials

Lessons that walk you through the app from start to finish. Do them in order.

- [Build your first Commander deck](tutorials/build-your-first-deck.md): sign in, build a small mono-green Commander deck, save it, and read its charts on the **Metrics** tab.
- [Tune a deck with objectives and versions](tutorials/tune-a-deck-with-versions.md): give the deck from the first tutorial a strategy, tag cards, try a swap as a saved version, compare it, and make it the main list.

## How-to guides

Steps for a specific task, for when you already know the basics.

### Using the app

- [Build a deck for Standard, Pioneer, Modern, Legacy, Vintage, or Pauper](how-to/build-a-60-card-deck.md): pick a format, use the sideboard and copy controls, change a deck's format, and see where else it's legal.
- [Import and export a deck](how-to/import-and-export-a-deck.md): save a deck to a file, or bring an exported JSON deck back in.
- [Set up partner commanders](how-to/set-up-partner-commanders.md): add, change, or remove a second commander when the commander has Partner.
- [Tag cards and set a deck strategy](how-to/tag-cards-and-set-strategy.md): create objectives, tag cards with them, set the deck's Strategy, and filter the gallery by tag.
- [Manage deck versions](how-to/manage-deck-versions.md): save, update, switch, compare, promote, and delete a deck's versions.
- [Get card suggestions](how-to/get-card-suggestions.md): find cards to add to a deck, or a replacement for one card, and act on what you find.
- [Test opening hands in the simulator](how-to/test-opening-hands.md): draw sample hands and play the first few turns to check land drops and early plays.
- [Use the wishlist](how-to/use-the-wishlist.md): track cards you want to get, link them to decks, and review them from inside a deck.

### Developing

- [Add a data write (mutation)](how-to/dev/add-a-data-write.md): add a persisted change that follows the app's two write conventions.
- [Call Scryfall without hitting rate limits](how-to/dev/call-scryfall.md): add a Scryfall request that stays under 2 requests per second and never shows stale results.
- [Add a daisyUI theme](how-to/dev/add-a-theme.md): add a new theme to the theme picker in the global header.

## Reference

Facts to look up: what exists, what it's called, and how it behaves.

- [Screens and tabs](reference/screens-and-tabs.md): every route, every Deck Detail tab, and the controls on each.
- [Deck rules](reference/deck-rules.md): each format's deck-construction rules, the functions behind them, and where each one is checked.
- [Card Roles](reference/card-roles.md): every Card Role detected from rules text, what text triggers it, and where it shows up.
- [Deck file formats](reference/deck-file-formats.md): the JSON, Excel, and text export formats, and the JSON schema **Import Deck** accepts.
- [Data model](reference/data-model.md): the domain types in `src/types/index.ts` and how `src/store/` maps them to Supabase tables.
- [Configuration and commands](reference/configuration-and-commands.md): environment variables, npm scripts, build configuration, commit gates, and deployment settings.
- [External services](reference/external-services.md): every external service the browser calls, the endpoints, the calling modules, and the limits.
- [Design Tokens](reference/design-tokens.md): breakpoints, type scale, and z-index rules for layout and styling work.

## Explanation

Background on how the app works and why it was built this way.

- [Strategy, Objectives, and Card Roles](explanation/strategy-objectives-and-card-roles.md): the three ways the app labels a deck or card, and why they are kept apart.
- [Formats and legality](explanation/formats-and-legality.md): where legality comes from, why every add path runs one check, and why a format switch flags cards instead of removing them.
- [How deck versions work](explanation/how-deck-versions-work.md): why a version is stored as a list of changes rather than a copy, and what that means when the deck changes.
- [How suggestions are chosen](explanation/how-suggestions-work.md): where suggested cards come from, and why two decks with the same commander can get different ones.
- [Architecture overview](explanation/architecture.md): a mental model of how the app fits together, and why it is built the way it is.

## Contributing

- [Development setup](contributing/development-setup.md): get the app running locally and make sure your changes pass the pre-commit hook.
- [Conventions and workflow](contributing/conventions.md): the rules every code or docs change follows, and where each kind of work-tracking document lives.

## Troubleshooting

- [Troubleshooting](troubleshooting.md): causes and fixes for common failures in the app.

## Project working docs

These files are not part of the docs set. They are working notes for the people and agents building the app, and they can be out of date. Check the code before you rely on them.

- [`CLAUDE.md`](../CLAUDE.md): architecture and style notes for AI coding agents.
- [`IDEAS.md`](../IDEAS.md): the product owner's backlog of feature ideas and bugs.
- [`tasks/README.md`](../tasks/README.md): index of scoped engineering tasks, written like GitHub issues.
- [`docs/plans/`](plans/): freeform implementation plans and audit notes.
- [`docs/diataxis/plan.md`](diataxis/plan.md): the plan used to build these docs.
