// Modules
import { useCallback, useMemo } from 'react';

// Types
import type { Deck, Objective } from '@/types';

// Utils
import { assignObjectiveColor } from '@/features/objectives/utils/objectivePalette';

// Store
import { deckStore } from '@/store/deckStore';

export function useObjectives(deck: Deck, onDeckChange: (deck: Deck) => void) {
  const safeDeck = useMemo<Deck>(
    () => ({
      ...deck,
      objectives: deck.objectives ?? [],
      entries: deck.entries.map((e) => ({
        ...e,
        objectiveIds: e.objectiveIds ?? [],
      })),
    }),
    [deck],
  );

  const createObjective = useCallback(
    (label: string, description: string) => {
      const existingColors = safeDeck.objectives.map((o) => o.color);
      const newObjective: Objective = {
        id: crypto.randomUUID(),
        label: label.trim(),
        description: description.trim(),
        color: assignObjectiveColor(existingColors),
      };
      const updated: Deck = {
        ...safeDeck,
        objectives: [...safeDeck.objectives, newObjective],
        updatedAt: new Date().toISOString(),
      };
      // Optimistic — update UI first
      onDeckChange(updated);
      // Persist in background, roll back on failure
      void deckStore.save(updated).catch(() => {
        onDeckChange(safeDeck);
      });
    },
    [safeDeck, onDeckChange],
  );

  const deleteObjective = useCallback(
    (objectiveId: string) => {
      const updated: Deck = {
        ...safeDeck,
        objectives: safeDeck.objectives.filter((o) => o.id !== objectiveId),
        entries: safeDeck.entries.map((e) => ({
          ...e,
          objectiveIds: e.objectiveIds.filter((id) => id !== objectiveId),
        })),
        updatedAt: new Date().toISOString(),
      };
      onDeckChange(updated);
      void deckStore.save(updated).catch(() => {
        onDeckChange(safeDeck);
      });
    },
    [safeDeck, onDeckChange],
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

  const updateObjective = useCallback(
    (objectiveId: string, label: string, description: string) => {
      const updated: Deck = {
        ...safeDeck,
        objectives: safeDeck.objectives.map((o) =>
          o.id === objectiveId
            ? { ...o, label: label.trim(), description: description.trim() }
            : o,
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
    objectives: safeDeck.objectives,
    entries: safeDeck.entries,
    createObjective,
    deleteObjective,
    assignObjective,
    unassignObjective,
    updateObjective,
  };
}
