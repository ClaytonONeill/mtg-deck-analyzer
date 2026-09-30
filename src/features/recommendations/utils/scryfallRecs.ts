// Types
import type { ScryfallCard } from "@/types";
import type { RecPlan } from "./deckSignals";

// Utils
import { signalQuery } from "./deckSignals";

const BASE = "https://api.scryfall.com";
/** Scryfall asks for <=10 requests/second; we stay well under it. */
const REQUEST_SPACING_MS = 120;
/** Only a signal's top results are trusted; deeper ones are mostly noise. */
const RESULTS_PER_SIGNAL = 60;

export interface Recommendation {
  card: ScryfallCard;
  score: number;
  reasons: string[];
}

// Session cache: plan key -> ranked pool (before per-deck exclusions, which the
// hook applies at render time so staging a swap doesn't trigger a refetch).
const cache = new Map<string, Recommendation[]>();

export function getCachedRecommendations(key: string): Recommendation[] | undefined {
  return cache.get(key);
}

/** Stable identity for a plan: same queries -> same results. */
export function planKey(plan: RecPlan, colorIdentity: string[]): string {
  return plan.signals
    .map((s) => `${s.label}=${signalQuery(plan, s, colorIdentity)}`)
    .join("|");
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });
}

async function searchScryfall(
  query: string,
  signal: AbortSignal,
): Promise<ScryfallCard[]> {
  const res = await fetch(
    `${BASE}/cards/search?q=${encodeURIComponent(query)}&order=edhrec&unique=cards`,
    { signal },
  );
  const data = await res.json();
  // "No cards found" comes back as a 404 error object: just an empty signal.
  if (data.object === "error") {
    if (res.status === 404) return [];
    throw new Error(data.details ?? "Scryfall search failed.");
  }
  return data.data as ScryfallCard[];
}

/**
 * Runs each signal's query (sequentially, spaced out), then merges results by
 * card name. A card's score is the sum of weight x rank-decay across every
 * signal that returned it, so cards several signals agree on rise to the top
 * and collect all of their reasons.
 */
export async function fetchRecommendations(
  plan: RecPlan,
  colorIdentity: string[],
  signal: AbortSignal,
): Promise<Recommendation[]> {
  const key = planKey(plan, colorIdentity);
  const cached = cache.get(key);
  if (cached) return cached;

  const byName = new Map<string, Recommendation>();
  for (const [i, s] of plan.signals.entries()) {
    if (i > 0) await sleep(REQUEST_SPACING_MS, signal);
    const cards = await searchScryfall(signalQuery(plan, s, colorIdentity), signal);
    cards.slice(0, RESULTS_PER_SIGNAL).forEach((card, rank) => {
      const points = s.weight / (1 + rank / 15);
      const existing = byName.get(card.name);
      if (existing) {
        existing.score += points;
        if (!existing.reasons.includes(s.label)) existing.reasons.push(s.label);
      } else {
        byName.set(card.name, {
          card,
          score: points,
          reasons: [s.label],
        });
      }
    });
  }

  const ranked = diversify([...byName.values()]).map((r) => ({
    ...r,
    reasons: [...r.reasons, ...plan.constraintReasons],
  }));
  cache.set(key, ranked);
  return ranked;
}

/** How much each earlier pick sharing a card's lead reason discounts it. */
const REPEAT_PENALTY = 0.35;

/**
 * Greedy re-rank so one dominant signal (e.g. a big tribe) can't fill every
 * slot: each pick discounts the remaining cards that share its lead reason,
 * letting the other signals surface on the first page.
 */
function diversify(recs: Recommendation[]): Recommendation[] {
  const remaining = [...recs];
  const picked: Recommendation[] = [];
  const leadCounts = new Map<string, number>();
  const adjusted = (r: Recommendation) =>
    r.score / (1 + REPEAT_PENALTY * (leadCounts.get(r.reasons[0]) ?? 0));

  while (remaining.length) {
    let best = 0;
    for (let i = 1; i < remaining.length; i++) {
      if (adjusted(remaining[i]) > adjusted(remaining[best])) best = i;
    }
    const [next] = remaining.splice(best, 1);
    picked.push(next);
    leadCounts.set(next.reasons[0], (leadCounts.get(next.reasons[0]) ?? 0) + 1);
  }
  return picked;
}
