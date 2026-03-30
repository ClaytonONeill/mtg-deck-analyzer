// Types
import type { WishlistEntry, ScryfallCard } from "@/types";

const STORAGE_KEY = "mtg_wishlist";

function getAll(): WishlistEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(entries: WishlistEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export const wishlistStore = {
  getAll,

  add(card: ScryfallCard, note: string = ""): WishlistEntry {
    const entries = getAll();
    const existing = entries.find((e) => e.card.id === card.id);
    if (existing) return existing;

    const entry: WishlistEntry = {
      id: crypto.randomUUID(),
      card,
      deckIds: [],
      note,
      addedAt: new Date().toISOString(),
    };
    save([...entries, entry]);
    return entry;
  },

  remove(entryId: string): void {
    save(getAll().filter((e) => e.id !== entryId));
  },

  tagDeck(entryId: string, deckId: string): void {
    save(
      getAll().map((e) =>
        e.id === entryId && !e.deckIds.includes(deckId)
          ? { ...e, deckIds: [...e.deckIds, deckId] }
          : e,
      ),
    );
  },

  untagDeck(entryId: string, deckId: string): void {
    save(
      getAll().map((e) =>
        e.id === entryId
          ? { ...e, deckIds: e.deckIds.filter((id) => id !== deckId) }
          : e,
      ),
    );
  },

  updateNote(entryId: string, note: string): void {
    save(getAll().map((e) => (e.id === entryId ? { ...e, note } : e)));
  },

  getForDeck(deckId: string): WishlistEntry[] {
    return getAll().filter((e) => e.deckIds.includes(deckId));
  },
};
