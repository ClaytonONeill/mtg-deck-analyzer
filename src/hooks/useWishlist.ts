// Modules
import { useState, useEffect, useCallback } from "react";

// Types
import type { ScryfallCard, WishlistEntry, Objective } from "@/types";

// Store
import { wishlistStore } from "@/store/wishlistStore";

export function useWishlist() {
  const [entries, setEntries] = useState<WishlistEntry[]>([]);

  useEffect(() => {
    let mounted = true;
    wishlistStore.getAll().then((data) => {
      if (mounted) setEntries(data);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const addCard = useCallback(async (card: ScryfallCard, note = "") => {
    const tempEntry: WishlistEntry = {
      id: crypto.randomUUID(),
      card,
      deckIds: [],
      objectives: [],
      note,
      addedAt: new Date().toISOString(),
    };

    setEntries((prev) => [tempEntry, ...prev]);

    try {
      const realEntry = await wishlistStore.add(card, note);
      setEntries((prev) =>
        prev.map((e) => (e.id === tempEntry.id ? realEntry : e)),
      );
      return realEntry;
    } catch {
      setEntries((prev) => prev.filter((e) => e.id !== tempEntry.id));
      throw new Error("Failed to add card to wishlist");
    }
  }, []);

  const removeEntry = useCallback(
    async (entryId: string) => {
      const snapshot = entries;
      setEntries((prev) => prev.filter((e) => e.id !== entryId));
      try {
        await wishlistStore.remove(entryId);
      } catch {
        setEntries(snapshot);
      }
    },
    [entries],
  );

  const tagDeck = useCallback(async (entryId: string, deckId: string) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.id === entryId && !e.deckIds.includes(deckId)
          ? { ...e, deckIds: [...e.deckIds, deckId] }
          : e,
      ),
    );
    try {
      await wishlistStore.tagDeck(entryId, deckId);
    } catch {
      setEntries((prev) =>
        prev.map((e) =>
          e.id === entryId
            ? { ...e, deckIds: e.deckIds.filter((id) => id !== deckId) }
            : e,
        ),
      );
    }
  }, []);

  const untagDeck = useCallback(async (entryId: string, deckId: string) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.id === entryId
          ? { ...e, deckIds: e.deckIds.filter((id) => id !== deckId) }
          : e,
      ),
    );
    try {
      await wishlistStore.untagDeck(entryId, deckId);
    } catch {
      setEntries((prev) =>
        prev.map((e) =>
          e.id === entryId ? { ...e, deckIds: [...e.deckIds, deckId] } : e,
        ),
      );
    }
  }, []);

  const assignObjective = useCallback(
    async (entryId: string, objective: Objective) => {
      setEntries((prev) =>
        prev.map((e) =>
          e.id === entryId
            ? { ...e, objectives: [...(e.objectives ?? []), objective] }
            : e,
        ),
      );
      try {
        await wishlistStore.addObjective(entryId, objective);
      } catch {
        setEntries((prev) =>
          prev.map((e) =>
            e.id === entryId
              ? {
                  ...e,
                  objectives: (e.objectives ?? []).filter(
                    (o) => o.id !== objective.id,
                  ),
                }
              : e,
          ),
        );
      }
    },
    [],
  );

  const unassignObjective = useCallback(
    async (entryId: string, objectiveId: string) => {
      const snapshot = entries.find((e) => e.id === entryId)?.objectives ?? [];
      setEntries((prev) =>
        prev.map((e) =>
          e.id === entryId
            ? {
                ...e,
                objectives: (e.objectives ?? []).filter(
                  (o) => o.id !== objectiveId,
                ),
              }
            : e,
        ),
      );
      try {
        await wishlistStore.removeObjective(entryId, objectiveId);
      } catch {
        setEntries((prev) =>
          prev.map((e) =>
            e.id === entryId ? { ...e, objectives: snapshot } : e,
          ),
        );
      }
    },
    [entries],
  );

  const getForDeck = useCallback(
    (deckId: string): WishlistEntry[] => {
      return entries.filter((e) => e.deckIds.includes(deckId));
    },
    [entries],
  );

  return {
    entries,
    addCard,
    removeEntry,
    tagDeck,
    untagDeck,
    assignObjective,
    unassignObjective,
    getForDeck,
  };
}
