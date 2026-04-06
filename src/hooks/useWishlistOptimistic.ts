// Modules
import { useState, useEffect } from "react";

// Hooks
import { useWishlist } from "./useWishlist";

// Types
import type { WishlistEntry, ScryfallCard } from "@/types";

export function useWishlistOptimistic() {
  const {
    entries: dbEntries,
    addCard,
    removeEntry,
    tagDeck,
    untagDeck,
    updateNote,
  } = useWishlist();

  // State
  const [localEntries, setLocalEntries] = useState<WishlistEntry[]>([]);

  useEffect(() => {
    setLocalEntries(dbEntries);
  }, [dbEntries]);

  const handleAddCard = async (card: ScryfallCard, note = "") => {
    const tempEntry: WishlistEntry = {
      id: crypto.randomUUID(), // temp id
      card,
      deckIds: [],
      note,
      addedAt: new Date().toISOString(),
    };

    setLocalEntries((prev) => [tempEntry, ...prev]);

    try {
      const realEntry = await addCard(card, note);
      setLocalEntries((prev) =>
        prev.map((e) => (e.id === tempEntry.id ? realEntry : e)),
      );
    } catch {
      setLocalEntries((prev) => prev.filter((e) => e.id !== tempEntry.id));
    }
  };

  const handleRemove = async (entryId: string) => {
    const prev = localEntries;
    setLocalEntries((curr) => curr.filter((e) => e.id !== entryId));

    try {
      await removeEntry(entryId);
    } catch {
      setLocalEntries(prev);
    }
  };

  const handleTagDeck = async (entryId: string, deckId: string) => {
    setLocalEntries((prev) =>
      prev.map((e) =>
        e.id === entryId && !e.deckIds.includes(deckId)
          ? { ...e, deckIds: [...e.deckIds, deckId] }
          : e,
      ),
    );

    try {
      await tagDeck(entryId, deckId);
    } catch {
      setLocalEntries((prev) =>
        prev.map((e) =>
          e.id === entryId
            ? { ...e, deckIds: e.deckIds.filter((id) => id !== deckId) }
            : e,
        ),
      );
    }
  };

  const handleUntagDeck = async (entryId: string, deckId: string) => {
    setLocalEntries((prev) =>
      prev.map((e) =>
        e.id === entryId
          ? { ...e, deckIds: e.deckIds.filter((id) => id !== deckId) }
          : e,
      ),
    );

    try {
      await untagDeck(entryId, deckId);
    } catch {
      setLocalEntries((prev) =>
        prev.map((e) =>
          e.id === entryId ? { ...e, deckIds: [...e.deckIds, deckId] } : e,
        ),
      );
    }
  };

  const handleUpdateNote = async (entryId: string, note: string) => {
    setLocalEntries((prev) =>
      prev.map((e) => (e.id === entryId ? { ...e, note } : e)),
    );

    try {
      await updateNote(entryId, note);
    } catch {
      setLocalEntries((prev) =>
        prev.map((e) => (e.id === entryId ? { ...e, note: e.note } : e)),
      );
    }
  };

  return {
    entries: localEntries,
    handleAddCard,
    handleRemove,
    handleTagDeck,
    handleUntagDeck,
    handleUpdateNote,
  };
}
