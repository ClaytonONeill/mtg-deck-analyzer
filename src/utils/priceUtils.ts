// Types
import type { ScryfallCard, ScryfallPrices } from '@/types';

export type PriceableCard = Pick<ScryfallCard, 'id' | 'prices'>;
export type LivePriceMap = Map<string, ScryfallPrices> | null | undefined;

export function resolvePrices(
  card: PriceableCard,
  livePrices: LivePriceMap,
): ScryfallPrices | undefined {
  return livePrices?.get(card.id) ?? card.prices;
}

/** Numeric sort value for a card's price (nonfoil, falling back to foil),
 * or null when Scryfall has no price data — callers should sort nulls last. */
export function getCardPriceValue(
  card: PriceableCard,
  livePrices: LivePriceMap,
): number | null {
  const prices = resolvePrices(card, livePrices);
  const raw = prices?.usd ?? prices?.usd_foil;
  return raw ? parseFloat(raw) : null;
}
