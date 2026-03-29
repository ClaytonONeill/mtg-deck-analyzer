// Modules
import { useCallback, useMemo } from 'react';

// Types
import type { Deck, DeckVersion, ScryfallCard } from '@/types';

// Store
import { deckStore } from '@/store/deckStore';

export function useDeckVersions(
  deck: Deck,
  onDeckChange: (deck: Deck) => void,
) {
  const safeDeck = useMemo<Deck>(
    () => ({
      ...deck,
      versions: deck.versions ?? [],
    }),
    [deck],
  );

  const createVersion = useCallback(
    (name: string, note: string) => {
      const newVersion: DeckVersion = {
        id: crypto.randomUUID(),
        name: name.trim(),
        note: note.trim(),
        swaps: [],
        createdAt: new Date().toISOString(),
      };
      const updated: Deck = {
        ...safeDeck,
        versions: [...safeDeck.versions, newVersion],
        updatedAt: new Date().toISOString(),
      };
      deckStore.save(updated);
      onDeckChange(updated);
    },
    [safeDeck, onDeckChange],
  );

  const deleteVersion = useCallback(
    (versionId: string) => {
      const updated: Deck = {
        ...safeDeck,
        versions: safeDeck.versions.filter((v) => v.id !== versionId),
        updatedAt: new Date().toISOString(),
      };
      deckStore.save(updated);
      onDeckChange(updated);
    },
    [safeDeck, onDeckChange],
  );

  const addSwap = useCallback(
    (versionId: string, removeCardId: string, addCard: ScryfallCard) => {
      const updated: Deck = {
        ...safeDeck,
        versions: safeDeck.versions.map((v) =>
          v.id === versionId
            ? {
                ...v,
                swaps: [...v.swaps, { removeCardId, addCard }],
              }
            : v,
        ),
        updatedAt: new Date().toISOString(),
      };
      deckStore.save(updated);
      onDeckChange(updated);
    },
    [safeDeck, onDeckChange],
  );

  const removeSwap = useCallback(
    (versionId: string, swapIndex: number) => {
      const updated: Deck = {
        ...safeDeck,
        versions: safeDeck.versions.map((v) =>
          v.id === versionId
            ? {
                ...v,
                swaps: v.swaps.filter((_, i) => i !== swapIndex),
              }
            : v,
        ),
        updatedAt: new Date().toISOString(),
      };
      deckStore.save(updated);
      onDeckChange(updated);
    },
    [safeDeck, onDeckChange],
  );

  const updateVersion = useCallback(
    (versionId: string, name: string, note: string) => {
      const updated: Deck = {
        ...safeDeck,
        versions: safeDeck.versions.map((v) =>
          v.id === versionId
            ? { ...v, name: name.trim(), note: note.trim() }
            : v,
        ),
        updatedAt: new Date().toISOString(),
      };
      deckStore.save(updated);
      onDeckChange(updated);
    },
    [safeDeck, onDeckChange],
  );

  return {
    versions: safeDeck.versions,
    createVersion,
    deleteVersion,
    addSwap,
    removeSwap,
    updateVersion,
  };
}
