// Types
import type { Deck, DeckEntry, DeckVersion } from '@/types';

// Store
import { inferCategory } from '@/store/deckStore';

export function applyVersionToDeck(deck: Deck, version: DeckVersion): Deck {
  let entries: DeckEntry[] = deck.entries.map((e) => ({ ...e }));

  for (const swap of version.swaps) {
    // Remove the card being swapped out
    entries = entries
      .map((e) =>
        e.card.id === swap.removeCardId
          ? { ...e, quantity: e.quantity - 1 }
          : e,
      )
      .filter((e) => e.quantity > 0);

    // Add the replacement card if not already present
    const existingIndex = entries.findIndex(
      (e) => e.card.id === swap.addCard.id,
    );
    if (existingIndex >= 0) {
      entries = entries.map((e, i) =>
        i === existingIndex ? { ...e, quantity: e.quantity + 1 } : e,
      );
    } else {
      entries = [
        ...entries,
        {
          card: swap.addCard,
          quantity: 1,
          category: inferCategory(swap.addCard),
          objectiveIds: [],
        },
      ];
    }
  }

  return {
    ...deck,
    entries,
  };
}

export function getVersionLabel(
  deck: Deck,
  versionId: string | 'main',
): string {
  if (versionId === 'main') return deck.name;
  return deck.versions.find((v) => v.id === versionId)?.name ?? 'Unknown';
}
