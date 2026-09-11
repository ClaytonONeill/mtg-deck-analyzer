// Modules
import { createContext, useContext } from 'react';

// Types
import type { ScryfallPrices } from '@/types';

export const CardPriceContext = createContext<Map<string, ScryfallPrices> | null>(
  null,
);

export function useCardPrices() {
  return useContext(CardPriceContext);
}
