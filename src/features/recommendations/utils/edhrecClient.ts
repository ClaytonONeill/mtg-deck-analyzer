// Types
import type { ScryfallCard } from "@/types";

/**
 * EDHREC adapter. EDHREC has no official API; its site reads static JSON from
 * json.edhrec.com (CORS-open, CDN-cached), which is what we read too. This is
 * the only file that knows that JSON's shape, so if EDHREC changes it, fixes
 * stay here. Missing or unparseable data means "no EDHREC data", never a crash.
 */

const BASE = "https://json.edhrec.com/pages/commanders";
export const EDHREC_SITE = "https://edhrec.com/commanders";

export interface EdhrecCandidate {
  /** EDHREC card ids are Scryfall card ids. */
  scryfallId: string;
  name: string;
  /** How much more often this card is played here than in same-color decks. */
  synergy: number;
  /** Share of this page's decks that play the card (0-1). */
  inclusion: number;
}

export interface EdhrecTheme {
  slug: string;
  label: string;
  /** Number of decks with this commander tagged with the theme. */
  count: number;
}

export interface EdhrecPage {
  numDecks: number;
  /** Ranked by deck count. Empty on theme pages. */
  themes: EdhrecTheme[];
  candidates: EdhrecCandidate[];
}

/** EDHREC's URL form of a card name: front face, no punctuation, dashed. */
export function edhrecSlug(name: string): string {
  return name
    .split(" // ")[0]
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Page slug for a commander (or pair: partner/background pages join both
 * names in alphabetical order). */
export function commanderSlug(
  commander: ScryfallCard | null,
  partner: ScryfallCard | null,
): string | null {
  if (!commander) return null;
  return [commander, partner]
    .filter((c): c is ScryfallCard => c !== null)
    .map((c) => edhrecSlug(c.name))
    .sort()
    .join("-");
}

// Parsed pages by URL; null = EDHREC has no page there.
const cache = new Map<string, EdhrecPage | null>();

export function getCachedPage(url: string): EdhrecPage | null | undefined {
  return cache.get(url);
}

export function commanderUrl(slug: string): string {
  return `${BASE}/${slug}.json`;
}

export function themeUrl(slug: string, theme: string): string {
  return `${BASE}/${slug}/${theme}.json`;
}

function num(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function parsePage(json: unknown): EdhrecPage | null {
  const root = json as {
    tag_counts?: { slug?: unknown; value?: unknown; count?: unknown }[];
    container?: {
      json_dict?: {
        card?: { num_decks?: unknown };
        cardlists?: { cardviews?: Record<string, unknown>[] }[];
      };
    };
  };
  const dict = root?.container?.json_dict;
  if (!dict || !Array.isArray(dict.cardlists)) return null;

  const byId = new Map<string, EdhrecCandidate>();
  for (const list of dict.cardlists) {
    if (!Array.isArray(list?.cardviews)) continue;
    for (const v of list.cardviews) {
      if (!v || typeof v.id !== "string" || typeof v.name !== "string") continue;
      const potential = num(v.potential_decks);
      byId.set(v.id, {
        scryfallId: v.id,
        name: v.name,
        synergy: num(v.synergy),
        inclusion: potential > 0 ? num(v.num_decks) / potential : 0,
      });
    }
  }

  const themes = (Array.isArray(root.tag_counts) ? root.tag_counts : [])
    .filter((t) => typeof t.slug === "string" && typeof t.value === "string")
    .map((t) => ({
      slug: t.slug as string,
      label: t.value as string,
      count: num(t.count),
    }));

  return { numDecks: num(dict.card?.num_decks), themes, candidates: [...byId.values()] };
}

/** Fetches and parses one EDHREC page. Resolves null when EDHREC has no page
 * (unknown slugs come back 403/404) or the JSON isn't in the expected shape;
 * throws only on network failure or abort. */
export async function fetchPage(
  url: string,
  signal: AbortSignal,
): Promise<EdhrecPage | null> {
  if (cache.has(url)) return cache.get(url) ?? null;
  const res = await fetch(url, { signal });
  if (res.status === 403 || res.status === 404) {
    cache.set(url, null);
    return null;
  }
  if (!res.ok) throw new Error(`EDHREC responded ${res.status}.`);
  const page = parsePage(await res.json());
  if (!page) console.warn("Unexpected EDHREC response shape:", url);
  cache.set(url, page);
  return page;
}
