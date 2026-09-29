// Modules
import { useCallback, useMemo } from 'react';

// Types
import type { Deck, DeckVersion, ScryfallCard } from '@/types';

// Store
import { deckStore } from '@/store/deckStore';

// Utils
import { applyVersionToDeck } from '@/features/deckVersions/utils/versionUtils';

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
    (name: string, note: string, swaps: PendingSwap[], baseVersionId?: string) => {
      // Branch off the version currently being viewed (if any): a new
      // version's swaps/overrides start from its base version's, so the
      // branch fully reflects what the user was looking at, not just the
      // newly staged swaps on top of a bare main deck.
      const baseVersion = baseVersionId
        ? safeDeck.versions.find((v) => v.id === baseVersionId)
        : undefined;

      const newVersion: DeckVersion = {
        id: crypto.randomUUID(),
        name: name.trim(),
        note: note.trim(),
        swaps: [...(baseVersion?.swaps ?? []), ...swaps],
        objectiveOverrides: baseVersion?.objectiveOverrides ?? [],
        createdAt: new Date().toISOString(),
      };
      const updated: Deck = {
        ...safeDeck,
        versions: [...safeDeck.versions, newVersion],
        updatedAt: new Date().toISOString(),
      };
      onDeckChange(updated);
      void deckStore.save(updated).catch(() => {
        onDeckChange(safeDeck);
      });
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

  const promoteVersionToMain = useCallback(
    (versionId: string) => {
      const version = safeDeck.versions.find((v) => v.id === versionId);
      if (!version) return;

      // Resolve the version's diff against the current main entries, then
      // write that resolved list back as the new main. This only touches
      // `entries` — it never removes the version itself; deleting a
      // now-merged version is a separate, explicitly-confirmed action.
      const resolved = applyVersionToDeck(safeDeck, version);
      const updated: Deck = {
        ...safeDeck,
        entries: resolved.entries,
        updatedAt: new Date().toISOString(),
      };
      onDeckChange(updated);
      void deckStore.save(updated).catch(() => {
        onDeckChange(safeDeck);
      });
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
    promoteVersionToMain,
  };
}
