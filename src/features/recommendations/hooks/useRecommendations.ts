// Modules
import { useState, useEffect } from "react";

// Types
import type { ScryfallCard } from "@/types";
import type { RecContext, RecInput, RecPlan } from "../utils/deckSignals";
import type { Recommendation } from "../utils/scryfallRecs";
import type { EdhrecPage } from "../utils/edhrecClient";
import type { EdhrecSources, RecMode } from "../utils/blend";

// Hooks
import { useLocalStorage } from "@/hooks/useLocalStorage";

// Utils
import {
  buildDeckPlan,
  buildSwapPlan,
  deckProfile,
  patternsForTheme,
} from "../utils/deckSignals";
import {
  fetchRecommendations,
  getCachedRecommendations,
  hydrateByIds,
  planKey,
} from "../utils/scryfallRecs";
import {
  commanderSlug,
  commanderUrl,
  EDHREC_SITE,
  fetchPage,
  getCachedPage,
  themeUrl,
} from "../utils/edhrecClient";
import {
  blend,
  chooseThemes,
  idsToHydrate,
  shortCommanderName,
  themesToFetch,
} from "../utils/blend";
import { isCardLegalForDeck, isDuplicateCard } from "@/store/deckStore";

export const PAGE_SIZE = 8;
/** Past ~32 cards the picks drift away from what the deck is about. */
export const MAX_MORE_CLICKS = 3;
/** EDHREC themes this high in a commander's ranking count as "what it does". */
const COMMANDER_THEME_DEPTH = 6;

/**
 * EDHREC status for this deck's commander:
 * - none: no commander yet
 * - missing: EDHREC has no page (e.g. a brand-new commander)
 * - error: EDHREC couldn't be reached
 */
export type EdhrecStatus = "none" | "loading" | "ok" | "missing" | "error";

interface Pools {
  search: Recommendation[];
  /** Set when the Scryfall searches failed (EDHREC results may still show). */
  searchError: string | null;
  themePages: Map<string, EdhrecPage>;
}

// Finished fetches by key, so switching tabs back doesn't flash a spinner.
const poolCache = new Map<string, Pools>();

const message = (err: unknown, fallback: string) =>
  err instanceof Error && err.message ? err.message : fallback;

const isAbort = (err: unknown) => err instanceof Error && err.name === "AbortError";

/** EDHREC's commander page: cached, else fetched; `error` on network failure. */
function useCommanderPage(url: string | null, retryCount: number) {
  const [failed, setFailed] = useState<{ url: string; retry: number } | null>(null);
  const cached = url ? getCachedPage(url) : undefined;
  const [, setLoaded] = useState(0);

  useEffect(() => {
    if (!url || getCachedPage(url) !== undefined) return;
    const controller = new AbortController();
    fetchPage(url, controller.signal)
      .then(() => setLoaded((n) => n + 1))
      .catch((err: unknown) => {
        if (!isAbort(err)) setFailed({ url, retry: retryCount });
      });
    return () => controller.abort();
  }, [url, retryCount]);

  if (!url) return { status: "none" as const, page: null };
  if (cached) return { status: "ok" as const, page: cached };
  if (cached === null) return { status: "missing" as const, page: null };
  if (failed?.url === url && failed.retry === retryCount) {
    return { status: "error" as const, page: null };
  }
  return { status: "loading" as const, page: null };
}

/**
 * Suggestions for a version-resolved deck (`target` omitted) or replacements
 * for one card in it (`target` set). `excludeCards` are cards already in the
 * deck, including cards staged by pending swaps.
 *
 * Sources: EDHREC's commander page (what decks with this commander play) and
 * the build(s) the deck's tags and cards point at, plus the Scryfall-search
 * signal engine (themes, tags, and role gaps from the deck's own text). All
 * of it is re-ranked against this deck in `blend`. Without EDHREC data the
 * search engine carries on alone, as before.
 */
export function useRecommendations(
  input: RecInput,
  excludeCards: ScryfallCard[],
  target: ScryfallCard | null = null,
) {
  const [mode, setMode] = useLocalStorage<RecMode>("recommendations-mode", "top");
  const [retryCount, setRetryCount] = useState(0);
  const [result, setResult] = useState<
    { fetchKey: string; pools: Pools } | { fetchKey: string; error: string } | null
  >(null);
  const [more, setMore] = useState({ key: "", clicks: 0 });

  const slug = commanderSlug(input.commander, input.partner);
  const commander = useCommanderPage(slug ? commanderUrl(slug) : null, retryCount);
  const page = commander.page;
  const settled = commander.status !== "loading";

  // Cheap (regexes over ~100 cards), so recomputed each render; `key` captures
  // everything the fetch depends on, so the effect only reruns when it changes.
  const ctx: RecContext = {
    commanderThemes: page
      ? page.themes.slice(0, COMMANDER_THEME_DEPTH).flatMap((t) => patternsForTheme(t.slug))
      : null,
  };
  const plan: RecPlan = target
    ? buildSwapPlan(input, target, ctx)
    : buildDeckPlan(input, ctx);
  const profile = deckProfile(input);
  const themeSlugs = page ? themesToFetch(page, profile) : [];
  const key = [slug ?? "", themeSlugs.join(","), planKey(plan, input.colorIdentity)].join("#");
  const fetchKey = `${key}#${retryCount}`;

  useEffect(() => {
    if (!settled || poolCache.has(key)) return;
    const controller = new AbortController();
    const { signal } = controller;

    const loadSearch = fetchRecommendations(plan, input.colorIdentity, signal);
    const loadEdhrec = (async () => {
      const themePages = new Map<string, EdhrecPage>();
      if (!slug || !page) return themePages;
      const pages = await Promise.allSettled(
        themeSlugs.map((t) => fetchPage(themeUrl(slug, t), signal)),
      );
      pages.forEach((p, i) => {
        if (p.status === "fulfilled" && p.value) themePages.set(themeSlugs[i], p.value);
      });
      await hydrateByIds(idsToHydrate({ page, themePages }), signal);
      return themePages;
    })();

    Promise.allSettled([loadSearch, loadEdhrec]).then(([search, themes]) => {
      if (signal.aborted) return;
      if (search.status === "rejected" && !page) {
        setResult({ fetchKey, error: message(search.reason, "Couldn't reach Scryfall.") });
        return;
      }
      if (themes.status === "rejected" && !isAbort(themes.reason)) {
        console.error("EDHREC theme pages failed:", themes.reason);
      }
      const pools: Pools = {
        search: search.status === "fulfilled" ? search.value : [],
        searchError:
          search.status === "rejected" ? message(search.reason, "Search failed.") : null,
        themePages: themes.status === "fulfilled" ? themes.value : new Map(),
      };
      poolCache.set(key, pools);
      setResult({ fetchKey, pools });
    });
    return () => controller.abort();
    // `plan`, `page`, `slug`, and `themeSlugs` are fully described by `key`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchKey, settled]);

  const current = result?.fetchKey === fetchKey ? result : null;
  const pools =
    poolCache.get(key) ??
    (current && "pools" in current ? current.pools : null) ??
    // Searches already cached from an earlier visit are enough to render.
    (!slug || commander.status === "missing" || commander.status === "error"
      ? cachedSearchOnly(plan, input.colorIdentity)
      : null);
  const error = !pools && current && "error" in current ? current.error : null;

  const edhrec: EdhrecSources | null =
    page && pools
      ? { commanderName: shortCommanderName(input), page, themePages: pools.themePages }
      : null;
  const themes = edhrec ? chooseThemes(edhrec, input, profile) : [];
  const ranked = pools
    ? blend({
        profile,
        edhrec,
        themes,
        search: pools.search,
        mode,
        target,
        constraintReasons: plan.constraintReasons,
        isExcluded: (card) =>
          isDuplicateCard(excludeCards, card) ||
          !isCardLegalForDeck(input.colorIdentity, card),
      })
    : [];

  const moreKey = `${key}#${mode}`;
  const moreClicks = more.key === moreKey ? more.clicks : 0;
  const visible = ranked.slice(0, PAGE_SIZE * (1 + moreClicks));

  // What the suggestions are based on, for the panel's summary line.
  const basis = [
    ...(edhrec
      ? [`${edhrec.commanderName} on EDHREC (${edhrec.page.numDecks.toLocaleString()} decks)`]
      : []),
    ...themes.map((t) => `${t.label} build (${t.why})`),
    ...plan.signals.map((s) => s.label),
    ...plan.constraintReasons,
  ];

  return {
    basis,
    visible,
    loading: !pools && !error,
    error,
    /** Non-fatal: shown as a note while other results still render. */
    searchError: pools?.searchError ?? null,
    edhrec: {
      status: commander.status,
      url: slug ? `${EDHREC_SITE}/${slug}` : null,
    },
    mode,
    setMode,
    moreClicks,
    canShowMore:
      moreClicks < MAX_MORE_CLICKS && ranked.length > visible.length,
    capped: moreClicks >= MAX_MORE_CLICKS,
    showMore: () => setMore({ key: moreKey, clicks: moreClicks + 1 }),
    retry: () => setRetryCount((n) => n + 1),
  };
}

/** Pools from cached searches alone, when there's no EDHREC data to wait on. */
function cachedSearchOnly(plan: RecPlan, colorIdentity: string[]): Pools | null {
  const search = getCachedRecommendations(planKey(plan, colorIdentity));
  return search ? { search, searchError: null, themePages: new Map() } : null;
}
