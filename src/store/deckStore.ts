import type { Deck, DeckEntry, ScryfallCard } from "../types";

const STORAGE_KEY = "mtg_decks";

export const deckStore = {
  getAll(): Deck[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  save(deck: Deck): void {
    const decks = this.getAll();
    const idx = decks.findIndex((d) => d.id === deck.id);
    if (idx >= 0) {
      decks[idx] = { ...deck, updatedAt: new Date().toISOString() };
    } else {
      decks.push(deck);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
  },

  delete(id: string): void {
    const decks = this.getAll().filter((d) => d.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
  },

  getById(id: string): Deck | undefined {
    return this.getAll().find((d) => d.id === id);
  },
};

// --- Deck factory helpers ---

export function createNewDeck(name: string): Deck {
  return {
    id: crypto.randomUUID(),
    name,
    commander: null,
    colorIdentity: [],
    entries: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function inferCategory(
  card: ScryfallCard,
): import("../types").CardCategory {
  const t = card.type_line.toLowerCase();
  if (t.includes("creature")) return "Creature";
  if (t.includes("land")) return "Land";
  if (t.includes("instant")) return "Instant";
  if (t.includes("sorcery")) return "Sorcery";
  if (t.includes("enchantment")) return "Enchantment";
  if (t.includes("artifact")) return "Artifact";
  if (t.includes("planeswalker")) return "Planeswalker";
  return "Other";
}

export function addCardToDeck(
  deck: Deck,
  card: ScryfallCard,
  isCommander = false,
): Deck {
  if (isCommander) {
    return {
      ...deck,
      commander: card,
      colorIdentity: card.color_identity,
      updatedAt: new Date().toISOString(),
    };
  }

  const category = inferCategory(card);
  const existing = deck.entries.findIndex((e) => e.card.id === card.id);

  const entries: DeckEntry[] =
    existing >= 0
      ? deck.entries.map((e, i) =>
          i === existing ? { ...e, quantity: e.quantity + 1 } : e,
        )
      : [...deck.entries, { card, quantity: 1, category }];

  return { ...deck, entries, updatedAt: new Date().toISOString() };
}

export function removeCardFromDeck(deck: Deck, cardId: string): Deck {
  const entries = deck.entries
    .map((e) => (e.card.id === cardId ? { ...e, quantity: e.quantity - 1 } : e))
    .filter((e) => e.quantity > 0);
  return { ...deck, entries, updatedAt: new Date().toISOString() };
}

export function isCardLegalForDeck(deck: Deck, card: ScryfallCard): boolean {
  if (!deck.commander) return true;
  if (card.color_identity.length === 0) return true; // colorless always legal
  return card.color_identity.every((c) => deck.colorIdentity.includes(c));
}

export function getDeckCardCount(deck: Deck): number {
  const commanderCount = deck.commander ? 1 : 0;
  return deck.entries.reduce((sum, e) => sum + e.quantity, 0) + commanderCount;
}
