# Call Scryfall without hitting rate limits

Use this guide to add a Scryfall request that stays under Scryfall's 2 requests/second limit and never shows stale results.

## Goal

You are adding code that fetches card data from `api.scryfall.com`, for example a new suggestion signal, a batch card lookup, or a new search box. When you finish, your request will wait its turn on the app's shared request schedule. If it can be superseded by a newer request, its results are dropped once a newer request starts. It also returns data typed as `ScryfallCard`, and double-faced cards render correctly.

This guide assumes you know React hooks, `fetch`, and `AbortController`, and that you have read the [Architecture overview](../../explanation/architecture.md). For the endpoint list, limits, and caches, see [External services](../../reference/external-services.md).

## Prerequisites

- A working dev setup (`npm run dev`). See [Configuration and commands](../../reference/configuration-and-commands.md).
- A way to tell which request shape you need:
  - **`/cards/search` or `/cards/collection`.** These have the strict 2 req/s limit. Use step 1.
  - **Search-as-you-type**, where each keystroke can replace the previous request. Use step 2.
  - **An image URL only** (`/cards/named?...&format=image`). This is an `<img src>`, not a `fetch`. Build it the way `configureBasicLandEndpoint` does in [`src/utils/utils.ts`](../../../src/utils/utils.ts) and skip to step 3.

## Steps

### 1. Put `/cards/search` and `/cards/collection` calls on the shared schedule

The schedule lives in [`src/features/recommendations/utils/scryfallRecs.ts`](../../../src/features/recommendations/utils/scryfallRecs.ts). `waitTurn(signal)` reserves the next slot. Slots are `REQUEST_SPACING_MS = 550` ms apart and shared module-wide. `waitTurn`, `BASE`, and `sleep` are not exported, so add your function **in that file**:

```ts
// scryfallRecs.ts
export async function searchByOracle(
  text: string,
  signal: AbortSignal,
): Promise<ScryfallCard[]> {
  await waitTurn(signal); // reserve a slot before every request
  const res = await fetch(
    `${BASE}/cards/search?q=${encodeURIComponent(`o:"${text}" format:commander`)}`,
    { signal },
  );
  const data = await res.json();
  if (data.object === "error") {
    if (res.status === 404) return []; // "no cards found" is not a failure
    throw new Error(data.details ?? "Scryfall search failed.");
  }
  return data.data as ScryfallCard[];
}
```

Follow these rules when you write it:

- **Call `await waitTurn(signal)` once per HTTP request**, not once per function. In a loop over chunks or signals, call it at the top of each iteration, as `fetchRecommendations` and `hydrateByIds` do.
- **Chunk `/cards/collection` at 75 identifiers** (`COLLECTION_CHUNK`). To load full cards by Scryfall id, call the existing `hydrateByIds(ids, signal)` and then read each card with `getCachedCard(id)`. Don't write a second collection loop. `hydrateByIds` skips ids that are already cached in `cardsById`.
- **Cache when results are stable for the session.** Use a module-level `Map`, as `cache` (keyed by `planKey`) and `cardsById` do. Return the cached value before calling `waitTurn` so a cache hit costs no slot.
- **Pass the caller's `AbortSignal` through** to both `waitTurn` and `fetch`. An aborted wait rejects with an `AbortError`, so a component that unmounts while queued gives up its turn.

To call it from a hook, create a controller in an effect and abort it on cleanup. Ignore `AbortError`. This is the pattern in [`useRecommendations.ts`](../../../src/features/recommendations/hooks/useRecommendations.ts):

```ts
useEffect(() => {
  const controller = new AbortController();
  searchByOracle(text, controller.signal)
    .then(setCards)
    .catch((err) => {
      if (err instanceof Error && err.name === "AbortError") return;
      setError("Search failed.");
    });
  return () => controller.abort();
}, [text]);
```

> **Two Scryfall callers are not on this schedule.** [`useCardSearch.ts`](../../../src/features/deckBuilder/hooks/useCardSearch.ts) calls `/cards/search` with no shared spacing; it relies on its 350 ms debounce and its 3-character minimum. [`src/context/CardPriceContext.tsx`](../../../src/context/CardPriceContext.tsx) calls `/cards/collection` in batches of 75 with its own 500 ms delay. Neither one coordinates with `waitTurn`. Your new call is only protected against other `scryfallRecs.ts` traffic.

### 2. Guard against stale responses, only if you have a real race

Add this step only when a newer request can replace an in-flight one: a search box, or a filter the user changes quickly. A single fetch on mount just needs the effect cleanup above.

Copy the three parts of [`useCardSearch.ts`](../../../src/features/deckBuilder/hooks/useCardSearch.ts):

1. **Abort the previous request.** Keep an `abortRef`. At the start of each run, call `abortRef.current?.abort()` and store a new `AbortController`.
2. **Stamp each request.** Increment `requestIdRef` and keep the value in a local `requestId`. After the `await`, call `setResults`, `setError`, and `setLoading(false)` only when `requestId === requestIdRef.current`.
3. **Debounce keystrokes.** Clear and reset a `setTimeout` (350 ms there). Below the minimum query length, abort, clear the results, and return without fetching. If Enter should bypass the debounce, add a separate "search now" path, like `searchNow`.

In the `catch`, return early on `AbortError`. Aborts are intentional and must not set an error.

### 3. Map results to `ScryfallCard` and handle double-faced cards

Type the parsed response as `ScryfallCard[]` (`data.data as ScryfallCard[]`) from [`src/types/index.ts`](../../../src/types/index.ts). Scryfall returns more fields than the type declares. Only the fields in the interface are saved with decks.

Double-faced cards (transform, modal DFC) have **no top-level `image_uris`**. Each entry in `card_faces` has its own. Don't read `card.image_uris` directly. Use the helpers in [`src/utils/cardImage.ts`](../../../src/utils/cardImage.ts):

```ts
import { getCardImageUris, isFlippableCard } from "@/utils/cardImage";

const front = getCardImageUris(card)?.normal;            // face 0, falls back to card.image_uris
const back = isFlippableCard(card) ? getCardImageUris(card, 1)?.normal : undefined;
```

To show a front/back toggle, use the existing `FlippableCardImage` component in `src/components/FlippableCardImage/`.

For text fields, a multi-face card can leave the top-level value empty. Fall back to the first face, as the existing code does:

- Mana cost: `card.mana_cost || card.card_faces?.[0]?.mana_cost` (`deckMetrics.ts`)
- Type line: `card.type_line || card.card_faces?.[0]?.type_line` (`deckSignals.ts`)
- Rules text across all faces: `cardText(card)` in [`deckSignals.ts`](../../../src/features/recommendations/utils/deckSignals.ts)

## Final Result

Check the change in the running app:

1. Run `npm run dev`, open the browser devtools **Network** tab, and filter on `api.scryfall.com`.
2. Trigger your code while a suggestions panel is also loading. Requests from `scryfallRecs.ts` start at least 550 ms apart, and no response has status `429`.
3. If you added step 2, type quickly into the input. Superseded requests show as cancelled, and the list shows only results for the final query.
4. Look at a double-faced card (for example, a transform commander). Both faces render, not a broken image.
5. Run `npm run lint` and `npm run build`. Both pass.

## Next Steps

- [External services](../../reference/external-services.md): Scryfall endpoints, limits, caches, and error handling.
- [How suggestions work](../../explanation/how-suggestions-work.md): why the recommendation engine queues and caches its requests.
- [Architecture overview](../../explanation/architecture.md): where Scryfall sits next to Supabase and EDHREC.
