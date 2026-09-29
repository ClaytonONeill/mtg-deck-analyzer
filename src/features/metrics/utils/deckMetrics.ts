// Types
import type { Deck, CardCategory } from "@/types";
import type {
  ColorGroup,
  ColorKey,
  TypeDataPoint,
  CMCDataPoint,
} from "../types/metrics.types";

function getColorKey(colorIdentity: string[]): ColorKey {
  if (colorIdentity.length === 0) return "colorless";
  if (colorIdentity.length === 1) return colorIdentity[0] as ColorKey;
  return "multicolor";
}

function mergeGroups(groups: ColorGroup[]): ColorGroup[] {
  const map = new Map<string, ColorGroup>();
  for (const g of groups) {
    const key =
      g.colorKey === "multicolor"
        ? g.colors.slice().sort().join("")
        : g.colorKey;
    if (map.has(key)) {
      map.get(key)!.count += g.count;
    } else {
      map.set(key, { ...g });
    }
  }
  return Array.from(map.values());
}

export function getTypeBreakdown(
  deck: Deck,
  includeLands: boolean,
): TypeDataPoint[] {
  const map = new Map<CardCategory, ColorGroup[]>();

  for (const entry of deck.entries) {
    if (!includeLands && entry.category === "Land") continue;
    const colorKey = getColorKey(entry.card.color_identity);
    const group: ColorGroup = {
      colorKey,
      colors: entry.card.color_identity,
      count: entry.quantity,
    };
    const existing = map.get(entry.category) ?? [];
    map.set(entry.category, [...existing, group]);
  }

  return Array.from(map.entries())
    .map(([category, groups]) => ({
      category,
      groups: mergeGroups(groups),
    }))
    .sort((a, b) => {
      const total = (d: TypeDataPoint) =>
        d.groups.reduce((s, g) => s + g.count, 0);
      return total(b) - total(a);
    });
}

export function getCMCBreakdown(
  deck: Deck,
  includeLands: boolean,
): CMCDataPoint[] {
  const map = new Map<number, ColorGroup[]>();

  for (const entry of deck.entries) {
    if (!includeLands && entry.category === "Land") continue;
    const cmc = entry.card.cmc ?? 0;
    const colorKey = getColorKey(entry.card.color_identity);
    const group: ColorGroup = {
      colorKey,
      colors: entry.card.color_identity,
      count: entry.quantity,
    };
    const existing = map.get(cmc) ?? [];
    map.set(cmc, [...existing, group]);
  }

  if (map.size === 0) return [];

  const max = Math.max(...map.keys());
  return Array.from({ length: max + 1 }, (_, i) => ({
    cmc: i,
    groups: mergeGroups(map.get(i) ?? []),
  }));
}

export interface ColorDemand {
  color: "W" | "U" | "B" | "R" | "G";
  /** Colored mana symbols of this color across the deck (hybrid splits). */
  pips: number;
  /** Share of all colored pips, 0-100. */
  percent: number;
}

const PIP_COLORS = ["W", "U", "B", "R", "G"] as const;

/**
 * Colored mana-symbol demand across the deck (commander/partner included),
 * sorted most-demanded first. Counts symbols in mana costs rather than color
 * identity, since pips are what decide which basic lands a deck wants.
 * Hybrid symbols ({W/U}) split one pip across their colors; Phyrexian and
 * {2/W} symbols count fully toward their color. Double-faced cards use their
 * front face's cost.
 */
export function getColorDemand(deck: Deck): ColorDemand[] {
  const totals: Record<string, number> = {};
  const addCost = (cost: string | undefined, quantity: number) => {
    for (const [, symbol] of (cost ?? "").matchAll(/\{([^}]+)\}/g)) {
      const colors = PIP_COLORS.filter((c) => symbol.split("/").includes(c));
      for (const c of colors) {
        totals[c] = (totals[c] ?? 0) + quantity / colors.length;
      }
    }
  };
  const cardCost = (card: Deck["entries"][number]["card"]) =>
    card.mana_cost || card.card_faces?.[0]?.mana_cost;

  if (deck.commander) addCost(cardCost(deck.commander), 1);
  if (deck.partner) addCost(cardCost(deck.partner), 1);
  for (const entry of deck.entries) addCost(cardCost(entry.card), entry.quantity);

  const total = Object.values(totals).reduce((sum, n) => sum + n, 0);
  if (total === 0) return [];

  return PIP_COLORS.filter((c) => (totals[c] ?? 0) > 0)
    .map((color) => ({
      color,
      pips: totals[color],
      percent: (totals[color] / total) * 100,
    }))
    .sort((a, b) => b.pips - a.pips);
}
