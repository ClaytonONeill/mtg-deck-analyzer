// Modules
import { useState, useEffect, useCallback } from "react";

// Types
import type { ScryfallCard, WishlistEntry } from "@/types";

// Store
import { wishlistStore } from "@/store/wishlistStore";

export function useWishlist() {
  const [entries, setEntries] = useState<WishlistEntry[]>([]);

  // Initial set to entries on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      const data = await wishlistStore.getAll();
      if (!mounted) return;
      setEntries(data);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    const data = await wishlistStore.getAll();
    setEntries(data);
  }, []);

  const addCard = useCallback(
    async (card: ScryfallCard, note: string = "") => {
      const entry = await wishlistStore.add(card, note);
      await refresh();
      return entry;
    },
    [refresh],
  );

  const removeEntry = useCallback(
    async (entryId: string) => {
      await wishlistStore.remove(entryId);
      await refresh();
    },
    [refresh],
  );

  const tagDeck = useCallback(
    async (entryId: string, deckId: string) => {
      await wishlistStore.tagDeck(entryId, deckId);
      await refresh();
    },
    [refresh],
  );

  const untagDeck = useCallback(
    async (entryId: string, deckId: string) => {
      await wishlistStore.untagDeck(entryId, deckId);
      await refresh();
    },
    [refresh],
  );

  const updateNote = useCallback(
    async (entryId: string, note: string) => {
      await wishlistStore.updateNote(entryId, note);
      await refresh();
    },
    [refresh],
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
    updateNote,
    getForDeck,
  };
}
