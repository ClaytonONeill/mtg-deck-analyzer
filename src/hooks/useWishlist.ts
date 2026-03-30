// Modules
import { useState, useCallback } from "react";

// Types
import type { ScryfallCard, WishlistEntry } from "@/types";

// Store
import { wishlistStore } from "@/store/wishlistStore";

export function useWishlist() {
  const [entries, setEntries] = useState<WishlistEntry[]>(() =>
    wishlistStore.getAll(),
  );

  const refresh = useCallback(() => {
    setEntries(wishlistStore.getAll());
  }, []);

  const addCard = useCallback(
    (card: ScryfallCard, note: string = "") => {
      wishlistStore.add(card, note);
      refresh();
    },
    [refresh],
  );

  const removeEntry = useCallback(
    (entryId: string) => {
      wishlistStore.remove(entryId);
      refresh();
    },
    [refresh],
  );

  const tagDeck = useCallback(
    (entryId: string, deckId: string) => {
      wishlistStore.tagDeck(entryId, deckId);
      refresh();
    },
    [refresh],
  );

  const untagDeck = useCallback(
    (entryId: string, deckId: string) => {
      wishlistStore.untagDeck(entryId, deckId);
      refresh();
    },
    [refresh],
  );

  const updateNote = useCallback(
    (entryId: string, note: string) => {
      wishlistStore.updateNote(entryId, note);
      refresh();
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
