// Types
import type { CardCategory, Deck, DeckEntry, Objective } from "@/types";

// Utils
import { applyVersionToDeck } from "./versionUtils";
import { getColorDemand } from "@/features/metrics/utils/deckMetrics";
import { detectCardRoles } from "@/features/recommendations/utils/deckSignals";
import { getCardPriceValue, type LivePriceMap } from "@/utils/priceUtils";
import { CATEGORY_ORDER } from "@/utils/sortCards";

export type CompareTarget = "main" | string;

/** The deck as it looks for one compare side: main as-is, or a version
 * applied on top of main. Unknown ids fall back to main. */
export function resolveCompareDeck(deck: Deck, id: CompareTarget): Deck {
  if (id === "main") return deck;
  const version = deck.versions.find((v) => v.id === id);
  return version ? applyVersionToDeck(deck, version) : deck;
}

/**
 * Maps each card a version swapped in to the main-deck card whose "slot" it
 * fills. Chained swaps (A→B, then B→C) resolve back to A. Cards that aren't
 * in the map fill their own slot.
 */
function slotMap(deck: Deck, id: CompareTarget): Map<string, string> {
  const map = new Map<string, string>();
  if (id === "main") return map;
  const version = deck.versions.find((v) => v.id === id);
  for (const swap of version?.swaps ?? []) {
    const slot = map.get(swap.removeCardId) ?? swap.removeCardId;
    map.set(swap.addCard.id, slot);
  }
  return map;
}

export interface SwapPair {
  /** Card leaving the deck, or null when the change is a pure addition. */
  out: DeckEntry | null;
  /** Card entering the deck, or null when the change is a pure removal. */
  in: DeckEntry | null;
}

export interface SwapGroup {
  category: CardCategory;
  pairs: SwapPair[];
}

/**
 * Card-level changes from one compare side to the other, as out→in pairs.
 *
 * Pairing is by slot: a version is main + swaps, so a card swapped in
 * replaces a specific main-deck card. Two sides that both changed the same
 * main-deck card pair up with each other (Version A's pick → Version B's
 * pick), and main vs a version reproduces that version's own swaps. Changes
 * with no counterpart stay unpaired. Quantities are compared, so trimming one
 * basic land shows up too.
 */
export function getSwapGroups(
  deck: Deck,
  fromId: CompareTarget,
  toId: CompareTarget,
): SwapGroup[] {
  const from = resolveCompareDeck(deck, fromId);
  const to = resolveCompareDeck(deck, toId);
  const fromSlots = slotMap(deck, fromId);
  const toSlots = slotMap(deck, toId);

  const fromQty = new Map(from.entries.map((e) => [e.card.id, e]));
  const toQty = new Map(to.entries.map((e) => [e.card.id, e]));

  // One element per copy that changed, tagged with the slot it fills.
  const removed: { entry: DeckEntry; slot: string }[] = [];
  const added: { entry: DeckEntry; slot: string }[] = [];

  for (const entry of from.entries) {
    const diff = entry.quantity - (toQty.get(entry.card.id)?.quantity ?? 0);
    const slot = fromSlots.get(entry.card.id) ?? entry.card.id;
    for (let i = 0; i < diff; i++) removed.push({ entry, slot });
  }
  for (const entry of to.entries) {
    const diff = entry.quantity - (fromQty.get(entry.card.id)?.quantity ?? 0);
    const slot = toSlots.get(entry.card.id) ?? entry.card.id;
    for (let i = 0; i < diff; i++) added.push({ entry, slot });
  }

  const pairs: SwapPair[] = [];
  const unmatchedAdds = [...added];
  for (const r of removed) {
    const i = unmatchedAdds.findIndex((a) => a.slot === r.slot);
    if (i >= 0) {
      pairs.push({ out: r.entry, in: unmatchedAdds[i].entry });
      unmatchedAdds.splice(i, 1);
    } else {
      pairs.push({ out: r.entry, in: null });
    }
  }
  for (const a of unmatchedAdds) pairs.push({ out: null, in: a.entry });

  // Group under the outgoing card's type (incoming for pure additions):
  // "what part of the deck changed" reads better than one long list.
  const groups = new Map<CardCategory, SwapPair[]>();
  for (const pair of pairs) {
    const category = (pair.out ?? pair.in)!.category;
    groups.set(category, [...(groups.get(category) ?? []), pair]);
  }

  const name = (p: SwapPair) => (p.out ?? p.in)!.card.name;
  const rank = (c: CardCategory) => {
    const i = CATEGORY_ORDER.indexOf(c);
    return i < 0 ? CATEGORY_ORDER.length : i;
  };
  return Array.from(groups.entries())
    .map(([category, list]) => ({
      category,
      pairs: list.sort((a, b) => name(a).localeCompare(name(b))),
    }))
    .sort((a, b) => rank(a.category) - rank(b.category));
}

export interface DeckStats {
  /** Cards in the 99 (commander/partner excluded). */
  cards: number;
  lands: number;
  /** Average mana value of non-land cards in the 99. */
  avgManaValue: number;
  /** Sum of known prices, commander and partner included. */
  price: number;
  categories: Record<string, number>;
  roles: Record<string, number>;
  objectives: Record<string, number>;
  /** Share of colored pips per color, 0-100. */
  colorDemand: Record<string, number>;
}

export function getDeckStats(deck: Deck, livePrices: LivePriceMap): DeckStats {
  let cards = 0;
  let lands = 0;
  let mvTotal = 0;
  let price = 0;
  const categories: Record<string, number> = {};
  const roles: Record<string, number> = {};
  const objectives: Record<string, number> = {};

  for (const e of deck.entries) {
    const q = e.quantity;
    cards += q;
    categories[e.category] = (categories[e.category] ?? 0) + q;
    if (e.category === "Land") lands += q;
    else mvTotal += (e.card.cmc ?? 0) * q;
    price += (getCardPriceValue(e.card, livePrices) ?? 0) * q;
    for (const role of detectCardRoles(e.card)) {
      roles[role] = (roles[role] ?? 0) + q;
    }
    for (const id of e.objectiveIds ?? []) {
      objectives[id] = (objectives[id] ?? 0) + q;
    }
  }
  for (const c of [deck.commander, deck.partner]) {
    if (c) price += getCardPriceValue(c, livePrices) ?? 0;
  }

  const colorDemand: Record<string, number> = {};
  for (const d of getColorDemand(deck)) colorDemand[d.color] = d.percent;

  return {
    cards,
    lands,
    avgManaValue: cards - lands > 0 ? mvTotal / (cards - lands) : 0,
    price,
    categories,
    roles,
    objectives,
    colorDemand,
  };
}

/** Objective tags used on either side, for the stats table. */
export function usedObjectives(
  all: Objective[],
  a: DeckStats,
  b: DeckStats,
): Objective[] {
  return all.filter((o) => a.objectives[o.id] || b.objectives[o.id]);
}
