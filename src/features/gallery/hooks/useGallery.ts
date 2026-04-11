// Modules
import { useCallback, useMemo } from "react";

// Types
import type { Deck } from "@/types";

// Store
import { deckStore } from "@/store/deckStore";

export function useGallery(deck: Deck, onDeckChange: (deck: Deck) => void) {
  const safeDeck = useMemo<Deck>(
    () => ({
      ...deck,
      entries: deck.entries.map((e) => ({
        ...e,
        objectiveIds: e.objectiveIds ?? [],
      })),
    }),
    [deck],
  );

  const assignObjective = useCallback(
    (cardId: string, objectiveId: string) => {
      const updated: Deck = {
        ...safeDeck,
        entries: safeDeck.entries.map((e) =>
          e.card.id === cardId && !e.objectiveIds.includes(objectiveId)
            ? { ...e, objectiveIds: [...e.objectiveIds, objectiveId] }
            : e,
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

  const unassignObjective = useCallback(
    (cardId: string, objectiveId: string) => {
      const updated: Deck = {
        ...safeDeck,
        entries: safeDeck.entries.map((e) =>
          e.card.id === cardId
            ? {
                ...e,
                objectiveIds: e.objectiveIds.filter((id) => id !== objectiveId),
              }
            : e,
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
    entries: safeDeck.entries,
    assignObjective,
    unassignObjective,
  };
}
