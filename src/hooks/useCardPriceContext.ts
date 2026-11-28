// Modules
import { createContext, useContext } from 'react';

// Types
import type { ScryfallPrices } from '@/types';
import type { LiveLegalities } from '@/features/formats/formats';

export const CardPriceContext = createContext<Map<string, ScryfallPrices> | null>(
  null,
);

/** Live format legalities by card id, fetched alongside the live prices.
 * Saved cards hold a snapshot from when they were added; ban lists change. */
export const CardLegalityContext = createContext<LiveLegalities | null>(null);

export function useCardPrices() {
  return useContext(CardPriceContext);
}

export function useCardLegalities() {
  return useContext(CardLegalityContext);
}
