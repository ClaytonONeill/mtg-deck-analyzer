// Modules
import { useEffect, useState, type ReactNode } from 'react';

// Context
import {
  CardLegalityContext,
  CardPriceContext,
} from '@/hooks/useCardPriceContext';

// Types
import type { ScryfallPrices } from '@/types';
import type { LiveLegalities } from '@/features/formats/formats';

const SCRYFALL_COLLECTION_URL = 'https://api.scryfall.com/cards/collection';
const BATCH_SIZE = 75;
const BATCH_DELAY_MS = 500;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface LiveCardData {
  prices: Map<string, ScryfallPrices>;
  legalities: LiveLegalities;
}

/** One `/cards/collection` pass yields both live prices and live
 * legalities, so the legality refresh costs no extra requests. */
async function fetchLiveCardData(ids: string[]): Promise<LiveCardData> {
  const prices = new Map<string, ScryfallPrices>();
  const legalities: LiveLegalities = new Map();

  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const chunk = ids.slice(i, i + BATCH_SIZE);
    const res = await fetch(SCRYFALL_COLLECTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifiers: chunk.map((id) => ({ id })) }),
    });
    const data = await res.json();
    for (const card of data.data ?? []) {
      prices.set(card.id, card.prices);
      if (card.legalities) legalities.set(card.id, card.legalities);
    }
    if (i + BATCH_SIZE < ids.length) await sleep(BATCH_DELAY_MS);
  }

  return { prices, legalities };
}

interface CardPriceProviderProps {
  cardIds: string[];
  children: ReactNode;
}

export function CardPriceProvider({ cardIds, children }: CardPriceProviderProps) {
  const idsKey = [...new Set(cardIds)].sort().join(',');
  const [live, setLive] = useState<LiveCardData>({
    prices: new Map(),
    legalities: new Map(),
  });

  useEffect(() => {
    const ids = idsKey ? idsKey.split(',') : [];
    if (ids.length === 0) return;

    let cancelled = false;
    fetchLiveCardData(ids)
      .then((data) => {
        if (!cancelled) setLive(data);
      })
      .catch(() => {
        // Live refresh is a display-only enhancement; silently fall back
        // to whatever prices/legalities are already on each card object.
      });

    return () => {
      cancelled = true;
    };
  }, [idsKey]);

  return (
    <CardPriceContext.Provider value={live.prices}>
      <CardLegalityContext.Provider value={live.legalities}>
        {children}
      </CardLegalityContext.Provider>
    </CardPriceContext.Provider>
  );
}
