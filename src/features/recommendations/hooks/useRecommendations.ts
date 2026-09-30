// Modules
import { useState, useEffect } from "react";

// Types
import type { ScryfallCard } from "@/types";
import type { RecInput, RecPlan } from "../utils/deckSignals";
import type { Recommendation } from "../utils/scryfallRecs";

// Utils
import { buildDeckPlan, buildSwapPlan } from "../utils/deckSignals";
import {
  fetchRecommendations,
  getCachedRecommendations,
  planKey,
} from "../utils/scryfallRecs";
import { isCardLegalForDeck, isDuplicateCard } from "@/store/deckStore";

export const PAGE_SIZE = 8;
/** Beyond ~32 cards the heuristic suggestions get noticeably weaker. */
export const MAX_MORE_CLICKS = 3;

type FetchResult =
  | { fetchKey: string; pool: Recommendation[] }
  | { fetchKey: string; error: string };

/**
 * Suggestions for a version-resolved deck (`target` omitted) or replacements
 * for one card in it (`target` set). `excludeCards` are cards already in the
 * deck, including cards staged by pending swaps.
 */
export function useRecommendations(
  input: RecInput,
  excludeCards: ScryfallCard[],
  target: ScryfallCard | null = null,
) {
  // Recomputed each render (cheap: regexes over ~100 cards); `key` captures
  // everything the fetch depends on, so the effect only reruns when it changes.
  const plan: RecPlan = target ? buildSwapPlan(input, target) : buildDeckPlan(input);
  const key = planKey(plan, input.colorIdentity);

  const [retryCount, setRetryCount] = useState(0);
  const [result, setResult] = useState<FetchResult | null>(null);
  const [more, setMore] = useState({ key: "", clicks: 0 });
  const fetchKey = `${key}#${retryCount}`;

  useEffect(() => {
    if (getCachedRecommendations(key)) return;
    const controller = new AbortController();
    fetchRecommendations(plan, input.colorIdentity, controller.signal)
      .then((pool) => setResult({ fetchKey, pool }))
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === "AbortError") return;
        setResult({
          fetchKey,
          error:
            err instanceof Error && err.message
              ? err.message
              : "Couldn't reach Scryfall.",
        });
      });
    return () => controller.abort();
    // `plan`/`colorIdentity` are fully described by `key` (see planKey).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchKey]);

  const current = result?.fetchKey === fetchKey ? result : null;
  const pool =
    getCachedRecommendations(key) ??
    (current && "pool" in current ? current.pool : null);
  const error = !pool && current && "error" in current ? current.error : null;

  const available = (pool ?? []).filter(
    (r) =>
      !isDuplicateCard(excludeCards, r.card) &&
      isCardLegalForDeck(input.colorIdentity, r.card),
  );
  const moreClicks = more.key === key ? more.clicks : 0;
  const visible = available.slice(0, PAGE_SIZE * (1 + moreClicks));

  return {
    plan,
    visible,
    loading: !pool && !error,
    error,
    moreClicks,
    canShowMore:
      moreClicks < MAX_MORE_CLICKS && available.length > visible.length,
    capped: moreClicks >= MAX_MORE_CLICKS,
    showMore: () => setMore({ key, clicks: moreClicks + 1 }),
    retry: () => setRetryCount((n) => n + 1),
  };
}
