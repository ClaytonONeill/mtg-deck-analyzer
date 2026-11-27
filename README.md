# MTG Deck Analyzer

This README explains what MTG Deck Analyzer is and where to start, as a player or as a contributor.

MTG Deck Analyzer is a personal Commander (EDH) deck-building tool for a handful of users. It is not a public product. It runs entirely in the browser and has no custom server. [Supabase](https://supabase.com) handles sign-in and stores decks, Objectives, and the wishlist. [Scryfall](https://scryfall.com)'s public API supplies card data and images, and EDHREC's public JSON feeds the card suggestions.

## Features

- **Deck builder**: pick a commander (and a partner, if allowed) and up to 99 more cards. The builder checks color identity and singleton rules.
- **Versions**: save named versions of a deck as sets of card swaps, then compare any two on the **Compare** view.
- **Objectives**: create your own strategy tags and apply them to cards. Card Roles such as ramp, draw, and removal are detected for you.
- **Metrics**: see **Card Types**, **Mana Curve**, and **Color Demand** charts for the main deck or any version.
- **Simulator**: draw opening hands and play through turns with the selected build.
- **Wishlist**: keep one wishlist across all your decks, and tag each card to the decks it's meant for.
- **Suggestions**: get card suggestions for the selected build from EDHREC and Scryfall data.
- **Import and export**: export a deck as JSON, Excel (.xlsx), or a text list. Import decks from JSON.

## Start here

- **Using the app:** [Build your first Commander deck](docs/tutorials/build-your-first-deck.md)
- **Working on the code:** [Development setup](docs/contributing/development-setup.md) (Node 22 LTS)
- **Everything else:** [Documentation home](docs/README.md)

## Quick commands

```bash
npm install       # install dependencies (also installs the Git hooks)
npm run dev       # start the Vite dev server
npm run build     # type-check, then build to dist/
npm run lint      # run ESLint
npm run preview   # serve the built dist/ locally
```

There is no test runner yet. Production deploys to Vercel are manual. Environment variables, the commit hooks, and deployment settings are covered in [Configuration and commands](docs/reference/configuration-and-commands.md).
