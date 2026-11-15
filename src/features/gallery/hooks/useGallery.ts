// Modules
import { useCallback, useMemo } from "react";

// Types
import type { Deck } from "@/types";

/**
 * Card-objective tagging for the main deck. Pure: it builds the updated deck
 * and hands it to `onDeckChange`, which owns persistence. Don't call
 * `deckStore.save` here — DeckDetailPage routes every whole-deck write
 * through one `useDeckAutosave` queue so writes can't land out of order.
 */
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
    },
    [safeDeck, onDeckChange],
  );

  return {
    entries: safeDeck.entries,
    assignObjective,
    unassignObjective,
  };
}
