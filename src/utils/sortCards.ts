// Types
import type { CardCategory, ScryfallCard, ScryfallPrices } from "@/types";

// Utils
import { inferCategory } from "@/utils/utils";
import { getCardPriceValue } from "@/utils/priceUtils";

export type CardSortKey = "type" | "color" | "cmc" | "name" | "price" | "date";
export type SortDirection = "asc" | "desc";

/** Anything card-shaped the gallery or wishlist sorts: deck entries carry a
 * stored `category`, wishlist entries carry `addedAt`. */
export interface SortableCard {
  card: ScryfallCard;
  category?: CardCategory;
  addedAt?: string;
}

export const CATEGORY_ORDER: CardCategory[] = [
  "Creature",
  "Instant",
  "Sorcery",
  "Enchantment",
  "Artifact",
  "Planeswalker",
  "Land",
  "Other",
];

const COLOR_ORDER = ["W", "U", "B", "R", "G"];

/** Compares on one key; `mult` is 1 for ascending, -1 for descending. Cards
 * without a price always sort last, whichever the direction. */
function compareOn(
  key: CardSortKey,
  a: SortableCard,
  b: SortableCard,
  mult: number,
  livePrices: Map<string, ScryfallPrices> | null,
): number {
  switch (key) {
    case "name":
      return mult * a.card.name.localeCompare(b.card.name);
    case "cmc":
      return mult * (a.card.cmc - b.card.cmc);
    case "type": {
      const aCat = a.category ?? inferCategory(a.card.type_line);
      const bCat = b.category ?? inferCategory(b.card.type_line);
      return mult * (CATEGORY_ORDER.indexOf(aCat) - CATEGORY_ORDER.indexOf(bCat));
    }
    case "color": {
      const aFirst = COLOR_ORDER.indexOf((a.card.color_identity ?? [])[0] ?? "");
      const bFirst = COLOR_ORDER.indexOf((b.card.color_identity ?? [])[0] ?? "");
      return mult * (aFirst - bFirst);
    }
    case "date":
      return (
        mult *
        (new Date(a.addedAt ?? 0).getTime() - new Date(b.addedAt ?? 0).getTime())
      );
    case "price": {
      const aPrice = getCardPriceValue(a.card, livePrices);
      const bPrice = getCardPriceValue(b.card, livePrices);
      if (aPrice === null && bPrice === null) return 0;
      if (aPrice === null) return 1;
      if (bPrice === null) return -1;
      return mult * (aPrice - bPrice);
    }
    default:
      return 0;
  }
}

/**
 * Two-level sort: `primary` in `direction`, ties broken by `secondary` in its
 * natural ascending order (A-Z, low-high), so "Type, then Name" reads
 * alphabetically within each type whichever way the types run. With no
 * secondary this matches the old single-key sorts exactly. Returns a new array.
 */
export function sortCards<T extends SortableCard>(
  items: T[],
  primary: CardSortKey,
  secondary: CardSortKey | null,
  direction: SortDirection,
  livePrices: Map<string, ScryfallPrices> | null,
): T[] {
  const mult = direction === "asc" ? 1 : -1;
  return [...items].sort(
    (a, b) =>
      compareOn(primary, a, b, mult, livePrices) ||
      (secondary ? compareOn(secondary, a, b, 1, livePrices) : 0),
  );
}
