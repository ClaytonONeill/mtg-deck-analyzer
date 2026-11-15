// Store
import { getDeckCardCount } from "@/store/deckStore";

// Utils
import { getCardPriceValue } from "@/utils/priceUtils";

// Types
import type { Deck } from "@/types";

export type DeckSort = "edited" | "created" | "name" | "complete";

export const DECK_SORTS: { value: DeckSort; label: string }[] = [
  { value: "edited", label: "Recently edited" },
  { value: "created", label: "Newest" },
  { value: "name", label: "Name (A–Z)" },
  { value: "complete", label: "Most complete" },
];

/** WUBRG plus "C" for colorless. */
export const FILTER_COLORS = ["W", "U", "B", "R", "G", "C"] as const;
export type FilterColor = (typeof FILTER_COLORS)[number];

/**
 * Decks matching the search text (deck, commander or partner name) and
 * containing every selected color. "C" matches only colorless decks.
 */
export function filterDecks(
  decks: Deck[],
  query: string,
  colors: FilterColor[],
): Deck[] {
  const q = query.trim().toLowerCase();
  return decks.filter((d) => {
    if (q) {
      const haystack = [d.name, d.commander?.name, d.partner?.name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (colors.includes("C") && d.colorIdentity.length > 0) return false;
    return colors
      .filter((c) => c !== "C")
      .every((c) => d.colorIdentity.includes(c));
  });
}

const time = (iso: string) => new Date(iso).getTime() || 0;

export function sortDecks(decks: Deck[], sort: DeckSort): Deck[] {
  const sorted = [...decks];
  switch (sort) {
    case "edited":
      return sorted.sort((a, b) => time(b.updatedAt) - time(a.updatedAt));
    case "created":
      return sorted.sort((a, b) => time(b.createdAt) - time(a.createdAt));
    case "name":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case "complete":
      return sorted.sort(
        (a, b) =>
          getDeckCardCount(b) - getDeckCardCount(a) ||
          time(b.updatedAt) - time(a.updatedAt),
      );
  }
}

/**
 * Approximate deck value from the prices saved on each card when it was
 * added. Deliberately not live: fetching live prices for every deck in the
 * library would mean hundreds of Scryfall lookups just to render Home.
 */
export function approxDeckValue(deck: Deck): number {
  let total = 0;
  for (const c of [deck.commander, deck.partner]) {
    if (c) total += getCardPriceValue(c, null) ?? 0;
  }
  for (const e of deck.entries) {
    total += (getCardPriceValue(e.card, null) ?? 0) * e.quantity;
  }
  return total;
}

const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 86400],
  ["month", 30 * 86400],
  ["week", 7 * 86400],
  ["day", 86400],
  ["hour", 3600],
  ["minute", 60],
];

/** "3 days ago", "yesterday", "just now". */
export function timeAgo(iso: string, now = Date.now()): string {
  const seconds = (time(iso) - now) / 1000;
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return "just now";
}
