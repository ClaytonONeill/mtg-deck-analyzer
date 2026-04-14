// Modules
import { useCallback, useMemo } from 'react';

// Types
import type { Deck, DeckVersion, ScryfallCard } from '@/types';

// Store
import { deckStore } from '@/store/deckStore';

interface PendingSwap {
  removeCardId: string;
  addCard: ScryfallCard;
}

export function useDeckVersions(
  deck: Deck,
  onDeckChange: (deck: Deck) => void,
) {
  const safeDeck = useMemo<Deck>(
    () => ({
      ...deck,
      versions: (deck.versions ?? []).map((v) => ({
        ...v,
        objectiveOverrides: v.objectiveOverrides ?? [],
      })),
    }),
    [deck],
  );

  const saveAsVersion = useCallback(
    (name: string, note: string, swaps: PendingSwap[]) => {
      const newVersion: DeckVersion = {
        id: crypto.randomUUID(),
        name: name.trim(),
        note: note.trim(),
        swaps,
        objectiveOverrides: [],
        createdAt: new Date().toISOString(),
      };
      const updated: Deck = {
        ...safeDeck,
        versions: [...safeDeck.versions, newVersion],
        updatedAt: new Date().toISOString(),
      };
      deckStore.save(updated);
      onDeckChange(updated);
      return newVersion.id;
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

  const assignObjectiveToVersion = useCallback(
    (versionId: string, cardId: string, objectiveId: string) => {
      const updated: Deck = {
        ...safeDeck,
        versions: safeDeck.versions.map((v) => {
          if (v.id !== versionId) return v;

          const safeOverrides = v.objectiveOverrides ?? [];
          const existing = safeOverrides.find((o) => o.cardId === cardId);

          const objectiveOverrides = existing
            ? safeOverrides.map((o) =>
                o.cardId === cardId && !o.objectiveIds.includes(objectiveId)
                  ? { ...o, objectiveIds: [...o.objectiveIds, objectiveId] }
                  : o,
              )
            : [...safeOverrides, { cardId, objectiveIds: [objectiveId] }];

          return { ...v, objectiveOverrides };
        }),
        updatedAt: new Date().toISOString(),
      };
      deckStore.save(updated);
      onDeckChange(updated);
    },
    [safeDeck, onDeckChange],
  );

  const unassignObjectiveFromVersion = useCallback(
    (versionId: string, cardId: string, objectiveId: string) => {
      const updated: Deck = {
        ...safeDeck,
        versions: safeDeck.versions.map((v) => {
          if (v.id !== versionId) return v;

          const safeOverrides = v.objectiveOverrides ?? [];
          const objectiveOverrides = safeOverrides.map((o) =>
            o.cardId === cardId
              ? {
                  ...o,
                  objectiveIds: o.objectiveIds.filter(
                    (id) => id !== objectiveId,
                  ),
                }
              : o,
          );

          return { ...v, objectiveOverrides };
        }),
        updatedAt: new Date().toISOString(),
      };
      deckStore.save(updated);
      onDeckChange(updated);
    },
    [safeDeck, onDeckChange],
  );

  const appendToVersion = useCallback(
    (versionId: string, newSwaps: PendingSwap[]) => {
      const updated: Deck = {
        ...safeDeck,
        versions: safeDeck.versions.map((v) =>
          v.id === versionId
            ? {
                ...v,
                swaps: [...v.swaps, ...newSwaps],
              }
            : v,
        ),
        updatedAt: new Date().toISOString(),
      };
      onDeckChange(updated);
      void deckStore.save(updated).catch(() => {
        onDeckChange(safeDeck);
      });
    },
    [safeDeck, onDeckChange],
  );

  return {
    versions: safeDeck.versions,
    saveAsVersion,
    deleteVersion,
    updateVersion,
    assignObjectiveToVersion,
    unassignObjectiveFromVersion,
    appendToVersion,
  };
}
