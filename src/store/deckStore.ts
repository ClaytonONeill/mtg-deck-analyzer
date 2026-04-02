// Types
import type { Deck, DeckEntry, ScryfallCard, CardCategory } from "@/types";

// Lib
import { supabase } from "@/lib/supabase";

// Utils
import { mergeColorIdentities } from "@/features/deckBuilder/utils/partnerUtils";

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

  async save(deck: Deck): Promise<void> {
    // TODO: Write to localStorage as before as we migrate app - remove after migration
    const decks = this.getAll();
    const idx = decks.findIndex((d) => d.id === deck.id);
    if (idx >= 0) {
      decks[idx] = { ...deck, updatedAt: new Date().toISOString() };
    } else {
      decks.push(deck);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));

    // Also write to Supabase
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      console.warn(
        "deckStore.save: no authenticated user, skipping Supabase write",
      );
      return;
    }

    const { error } = await supabase.from("decks").upsert(
      {
        id: deck.id,
        user_id: user.id,
        name: deck.name,
        commander: deck.commander,
        partner: deck.partner,
        color_identity: deck.colorIdentity,
        entries: deck.entries,
        objectives: deck.objectives,
        versions: deck.versions,
        created_at: deck.createdAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );

    if (error) {
      console.error("deckStore.save Supabase error:", error);
    } else {
      console.log("deckStore.save Supabase success:", deck.name);
    }
  },

  delete(id: string): void {
    const decks = this.getAll().filter((d) => d.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
  },

  getById(id: string): Deck | undefined {
    return this.getAll().find((d) => d.id === id);
  },
};

export function createNewDeck(name: string): Deck {
  return {
    id: crypto.randomUUID(),
    name,
    commander: null,
    partner: null,
    colorIdentity: [],
    entries: [],
    objectives: [],
    versions: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function inferCategory(card: ScryfallCard): CardCategory {
  const t = card.type_line ? card.type_line.toLowerCase() : "";
  if (t.includes("creature")) return "Creature";
  if (t.includes("land")) return "Land";
  if (t.includes("instant")) return "Instant";
  if (t.includes("sorcery")) return "Sorcery";
  if (t.includes("enchantment")) return "Enchantment";
  if (t.includes("artifact")) return "Artifact";
  if (t.includes("planeswalker")) return "Planeswalker";
  return "Other";
}

export function setCommander(deck: Deck, card: ScryfallCard): Deck {
  return {
    ...deck,
    commander: card,
    partner: null,
    colorIdentity: card.color_identity,
    updatedAt: new Date().toISOString(),
  };
}

export function setPartner(deck: Deck, card: ScryfallCard): Deck {
  const merged = deck.commander
    ? mergeColorIdentities(deck.commander.color_identity, card.color_identity)
    : card.color_identity;
  return {
    ...deck,
    partner: card,
    colorIdentity: merged,
    updatedAt: new Date().toISOString(),
  };
}

export function removePartner(deck: Deck): Deck {
  return {
    ...deck,
    partner: null,
    colorIdentity: deck.commander?.color_identity ?? [],
    updatedAt: new Date().toISOString(),
  };
}

export function addCardToDeck(deck: Deck, card: ScryfallCard): Deck {
  const category = inferCategory(card);
  const existing = deck.entries.findIndex((e) => e.card.id === card.id);

  const entries: DeckEntry[] =
    existing >= 0
      ? deck.entries.map((e, i) =>
          i === existing ? { ...e, quantity: e.quantity + 1 } : e,
        )
      : [...deck.entries, { card, quantity: 1, category, objectiveIds: [] }];

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
  if (card.color_identity.length === 0) return true;
  return card.color_identity.every((c) => deck.colorIdentity.includes(c));
}

export function getDeckCardCount(deck: Deck): number {
  const commanderCount = deck.commander ? 1 : 0;
  const partnerCount = deck.partner ? 1 : 0;
  return (
    deck.entries.reduce((sum, e) => sum + e.quantity, 0) +
    commanderCount +
    partnerCount
  );
}

export function exportDeck(deck: Deck): void {
  const json = JSON.stringify(deck, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${deck.name.replace(/\s+/g, "_")}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function importDeckFromFile(file: File): Promise<Deck> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (!isValidDeck(parsed)) {
          reject(new Error("Invalid deck file — missing required fields."));
          return;
        }
        resolve(parsed as Deck);
      } catch {
        reject(
          new Error("Could not parse file. Make sure it is a valid deck JSON."),
        );
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsText(file);
  });
}

function isValidDeck(obj: unknown): boolean {
  if (typeof obj !== "object" || obj === null) return false;
  const d = obj as Record<string, unknown>;
  return (
    typeof d.id === "string" &&
    typeof d.name === "string" &&
    typeof d.createdAt === "string" &&
    typeof d.updatedAt === "string" &&
    Array.isArray(d.entries)
  );
}
