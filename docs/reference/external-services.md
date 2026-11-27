# External services

This page lists every external service the browser calls, the endpoints it uses, which module calls them, and the limits that apply.

The app has no server of its own. Every request below goes straight from the browser.

| Service | Base URL | Auth | Called from |
| --- | --- | --- | --- |
| Supabase (Auth + Postgres) | `VITE_SUPABASE_URL` | Anon key + user session | `src/lib/supabase.ts` client, used by `src/context/AuthContext.tsx`, `src/pages/LoginPage.tsx`, `src/store/*.ts` |
| Scryfall API | `https://api.scryfall.com` | None | `src/features/recommendations/utils/scryfallRecs.ts`, `src/features/deckBuilder/hooks/useCardSearch.ts`, `src/context/CardPriceContext.tsx`, `src/utils/utils.ts` |
| Scryfall CDNs | `https://cards.scryfall.io`, `https://svgs.scryfall.io` | None | Card images (`image_uris` on card objects), `src/components/ManaSymbol/ManaSymbol.tsx` |
| EDHREC static JSON | `https://json.edhrec.com/pages/commanders` | None | `src/features/recommendations/utils/edhrecClient.ts` only |

## Supabase

### Client

`src/lib/supabase.ts` creates one client with `createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)`. If either variable is missing, the module throws `Missing Supabase environment variables` when it loads. See [Configuration and commands](configuration-and-commands.md) for the variables.

### Auth methods

| Method | Module | Trigger | Result shown to the user |
| --- | --- | --- | --- |
| `auth.getSession()` | `AuthContext.tsx` | App mount | Sets `user`/`session`; `loading` clears when it settles |
| `auth.onAuthStateChange()` | `AuthContext.tsx` | App mount (unsubscribed on unmount) | Updates `user`/`session` on every auth event |
| `auth.signInWithPassword({ email, password })` | `LoginPage.tsx` | Sign-in view submit | Error message on failure |
| `auth.signUp({ email, password })` | `LoginPage.tsx` | Sign-up view submit | "Check your email to confirm your account." |
| `auth.resetPasswordForEmail(email)` | `LoginPage.tsx` | Forgot-password view submit | "Password reset link sent — check your email." |
| `auth.signOut()` | `AuthContext.tsx` (`signOut`) | Sign-out in `Header.tsx` (via `useAuth`) | Session cleared via `onAuthStateChange` |
| `auth.getUser()` | `deckStore.save`, `objectivesStore.addObjective`, `wishlistStore.add` | Before each insert/upsert | Throws `…: no authenticated user` if there is no user |

### Tables

All table access goes through the store modules. Inserts and upserts set `user_id` from `auth.getUser()`. Reads don't filter by `user_id` in code.

> TODO(product owner): confirm that Row Level Security policies scope each table to `auth.uid() = user_id`. The client code doesn't filter reads by user, so RLS must do it.

| Table | Store module | Columns written or read | Operations |
| --- | --- | --- | --- |
| `decks` | `src/store/deckStore.ts` | `id`, `user_id`, `name`, `commander`, `partner`, `color_identity`, `entries`, `objectives`, `versions`, `created_at`, `updated_at` | `select` ordered by `created_at` desc; `select … eq(id) maybeSingle`; `upsert` on conflict `id`; `delete eq(id)` |
| `objectives` | `src/store/objectivesStore.ts` | `id`, `user_id`, `label`, `description`, `color`, `created_at` | `select` ordered by `created_at` desc; `insert … select single`; `update eq(id)`; `delete eq(id)` |
| `wishlist_entries` | `src/store/wishlistStore.ts` | `id`, `user_id`, `card`, `deck_ids`, `objectives`, `note`, `added_at` | `select` ordered by `added_at` desc; `select eq("card->>id")` (duplicate check); `select contains(deck_ids, [deckId])`; `insert`; `update` of `deck_ids`, `note`, `objectives`; `delete eq(id)` |

Read methods return `[]` or `undefined` on error. Write methods throw. Column types and the domain mapping are in [Data model](data-model.md).

## Scryfall

### Endpoints

| Endpoint | Method | Module | Query / body | Purpose |
| --- | --- | --- | --- | --- |
| `/cards/search` | GET | `useCardSearch.ts` | `q=<query> format:commander` (plus `is:commander` for commander search), `order=name` | Deck-builder card and commander search |
| `/cards/search` | GET | `scryfallRecs.ts` (`searchScryfall`) | `q=<signal query>`, `order=edhrec`, `unique=cards` | One request per suggestion signal |
| `/cards/collection` | POST | `scryfallRecs.ts` (`hydrateByIds`) | `{ identifiers: [{ id }, …] }`, up to 75 ids | Loads full cards for EDHREC candidates |
| `/cards/collection` | POST | `CardPriceContext.tsx` (`fetchPrices`) | `{ identifiers: [{ id }, …] }`, up to 75 ids | Live price refresh |
| `/cards/named` | GET (as `<img src>`) | `utils.ts` (`configureBasicLandEndpoint`) | `exact=<land>`, `format=image`, `version=normal` | Basic land images in `HandSimulator` and `SelectedCategoryModal` |

No request sends custom headers other than `Content-Type: application/json` on the `POST` calls.

### Rate limit

`scryfallRecs.ts` states Scryfall's limit for `/cards/search` and `/cards/collection` as 2 requests per second, and says a `429` locks the client out for 30 seconds.

Each module paces its requests differently:

| Module | Pacing |
| --- | --- |
| `scryfallRecs.ts` | One module-level schedule, `REQUEST_SPACING_MS = 550`. Every search and collection request calls `waitTurn()` first, so all suggestion requests are at least 550 ms apart. This holds across both suggestion panels (`DeckDetailPage` and `SwapSidebar`). Waits can be aborted. |
| `CardPriceContext.tsx` | `BATCH_DELAY_MS = 500` between its own 75-id batches. It doesn't use the `scryfallRecs.ts` schedule. |
| `useCardSearch.ts` | 350 ms debounce while typing; Enter (`searchNow`) skips the debounce. Queries shorter than 3 characters send nothing. A new search aborts the one in flight. No shared schedule. |
| `configureBasicLandEndpoint` | None. The browser loads the image URL. |

How to add a Scryfall call within these limits is covered in [Call Scryfall without hitting rate limits](../how-to/dev/call-scryfall.md).

### Caches

All caches are in-memory `Map`s at module level. They last until the page reloads and are not persisted.

| Cache | Module | Key → value |
| --- | --- | --- |
| `cache` | `scryfallRecs.ts` | Plan key (`planKey(plan, colorIdentity)`) → ranked `Recommendation[]` |
| `cardsById` | `scryfallRecs.ts` | Scryfall id → `ScryfallCard`; `hydrateByIds` fetches only missing ids |
| `poolCache` | `useRecommendations.ts` | Fetch key → finished suggestion pools |

`useCardSearch.ts`, `CardPriceContext.tsx`, and `configureBasicLandEndpoint` don't cache. `CardPriceProvider` fetches again whenever its sorted, de-duplicated id set changes.

### Error handling

| Module | On failure |
| --- | --- |
| `useCardSearch.ts` | A Scryfall error object returns `[]`. A network error sets "Search failed. Check your connection." Abort errors are ignored. |
| `scryfallRecs.ts` `searchScryfall` | A `404` error object (no cards found) returns `[]`. Other error objects throw `details` or "Scryfall search failed." |
| `scryfallRecs.ts` `hydrateByIds` | A failed chunk is logged and skipped. Only abort errors propagate. |
| `CardPriceContext.tsx` | Errors are swallowed. Prices fall back to the `prices` already on each card object. |

### Price fields

The `ScryfallPrices` type (`src/types/index.ts`) has these fields, each `string | null`: `usd`, `usd_foil`, `usd_etched`, `eur`, `eur_foil`, `tix`.

- `resolvePrices` (`src/utils/priceUtils.ts`) uses the live price from `CardPriceContext` if there is one, and otherwise `card.prices`.
- `CardPrice` shows `usd`, falling back to `usd_foil` with a "(foil)" suffix, labelled "· TCGplayer". It shows "No price info" if both are missing.
- `getCardPriceValue` (the sort value) is `parseFloat(usd ?? usd_foil)`, or `null` if neither exists.
- `usd_etched`, `eur`, `eur_foil`, and `tix` are typed but not read.

`CardPriceProvider` wraps `DeckBuilderPage`, `DeckDetailPage`, and `WishlistPage`.

## EDHREC

### Status

EDHREC has no official API. The app reads the static JSON that edhrec.com's own site loads from `json.edhrec.com` (CORS-open, CDN-cached). The format is undocumented and can change without notice.

`src/features/recommendations/utils/edhrecClient.ts` is the only module that knows this URL or the JSON's shape. Other modules use its exports (`commanderSlug`, `commanderUrl`, `themeUrl`, `fetchPage`, `getCachedPage`, `EDHREC_SITE`).

### Endpoints

| URL | Built by | Purpose |
| --- | --- | --- |
| `https://json.edhrec.com/pages/commanders/<slug>.json` | `commanderUrl(slug)` | Commander page: deck count, themes, candidate cards |
| `https://json.edhrec.com/pages/commanders/<slug>/<theme>.json` | `themeUrl(slug, theme)` | Theme page for one commander |
| `https://edhrec.com/commanders/<slug>` | `EDHREC_SITE` | Human-facing link only; not fetched |

`<slug>` is the commander name with the front face only, accents and punctuation removed, lowercased, and non-alphanumerics replaced by `-`. For a partner or background pair, the two slugs are sorted alphabetically and joined with `-` (`commanderSlug`).

`useRecommendations` fetches the commander page first. It then fetches up to 6 theme pages in parallel (`MAX_THEME_PAGES`). These are themes that match the deck plus the top 4 by deck count (`TOP_THEMES`), from `blend.ts`. Candidate ids are Scryfall ids, and `hydrateByIds` turns them into full cards through `/cards/collection`.

### Parsed fields

`parsePage` reads:

- `container.json_dict.card.num_decks` → `numDecks`
- `container.json_dict.cardlists[].cardviews[]` → `id`, `name`, `synergy`, and `num_decks / potential_decks` as `inclusion`
- `tag_counts[]` → `slug`, `value` (label), `count`

A response without `container.json_dict.cardlists` parses as `null`, and a warning is logged.

### Caching and errors

- `cache` in `edhrecClient.ts` maps URL → parsed page, or `null` if EDHREC has no page. It is in memory for the session.
- A `403` or `404` caches `null` and resolves `null`. The Suggestions panel then shows "No EDHREC data for this commander yet…".
- Any other non-OK status throws `EDHREC responded <status>.`. A network failure also throws. If the commander page fails, the Suggestions panel shows "Couldn't reach EDHREC…" with a "Retry" button, and Scryfall-only suggestions continue.
- There is no rate limiting or request spacing for EDHREC.

## Related

- [Call Scryfall without hitting rate limits](../how-to/dev/call-scryfall.md)
- [Architecture overview](../explanation/architecture.md)
- [Data model](data-model.md)
- [How suggestions are chosen](../explanation/how-suggestions-work.md)
