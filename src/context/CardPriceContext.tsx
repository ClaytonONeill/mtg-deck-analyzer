// Modules
import { useEffect, useState, type ReactNode } from 'react';

// Context
import { CardPriceContext } from '@/hooks/useCardPriceContext';

// Types
import type { ScryfallPrices } from '@/types';

const SCRYFALL_COLLECTION_URL = 'https://api.scryfall.com/cards/collection';
const BATCH_SIZE = 75;
const BATCH_DELAY_MS = 500;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchPrices(ids: string[]): Promise<Map<string, ScryfallPrices>> {
  const result = new Map<string, ScryfallPrices>();

  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const chunk = ids.slice(i, i + BATCH_SIZE);
    const res = await fetch(SCRYFALL_COLLECTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifiers: chunk.map((id) => ({ id })) }),
    });
    const data = await res.json();
    for (const card of data.data ?? []) {
      result.set(card.id, card.prices);
    }
    if (i + BATCH_SIZE < ids.length) await sleep(BATCH_DELAY_MS);
  }

  return result;
}

interface CardPriceProviderProps {
  cardIds: string[];
  children: ReactNode;
}

export function CardPriceProvider({ cardIds, children }: CardPriceProviderProps) {
  const idsKey = [...new Set(cardIds)].sort().join(',');
  const [prices, setPrices] = useState<Map<string, ScryfallPrices>>(new Map());

  useEffect(() => {
    const ids = idsKey ? idsKey.split(',') : [];
    if (ids.length === 0) return;

    let cancelled = false;
    fetchPrices(ids)
      .then((map) => {
        if (!cancelled) setPrices(map);
      })
      .catch(() => {
        // Live refresh is a display-only enhancement; silently fall back
        // to whatever prices (if any) are already on each card object.
      });

    return () => {
      cancelled = true;
    };
  }, [idsKey]);

  return (
    <CardPriceContext.Provider value={prices}>
      {children}
    </CardPriceContext.Provider>
  );
}
