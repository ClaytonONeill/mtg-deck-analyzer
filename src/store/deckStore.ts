// Types
import type { Deck, DeckEntry, ScryfallCard, CardCategory } from "@/types";

// Lib
import { supabase } from "@/lib/supabase";

// Utils
import { mergeColorIdentities } from "@/features/deckBuilder/utils/partnerUtils";

export const deckStore = {
  async getAll(): Promise<Deck[]> {
    const { data, error } = await supabase
      .from("decks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("deckStore.getAll error:", error);
      return [];
    }

    return (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      commander: row.commander ?? null,
      partner: row.partner ?? null,
      colorIdentity: row.color_identity ?? [],
      entries: row.entries ?? [],
      objectives: row.objectives ?? [],
      versions: row.versions ?? [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  },

  async save(deck: Deck): Promise<void> {
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
      console.error("deckStore.save error:", error);
    } else {
      console.log("deckStore.save success:", deck.name);
    }
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("decks").delete().eq("id", id);

    if (error) {
      console.error("deckStore.delete error:", error);
      throw new Error("Failed to delete deck");
    } else {
      console.log("deckStore.delete success for id:", id);
    }
  },

  async getById(id: string): Promise<Deck | undefined> {
    const { data, error } = await supabase
      .from("decks")
      .select("*")
      .eq("id", id)
      .single(); // Returns a single object instead of an array

    if (error) {
      // Handle the case where the record simply doesn't exist
      if (error.code === "PGRST116") return undefined;

      console.error("deckStore.getById error:", error);
      return undefined;
    }

    if (!data) return undefined;

    // Mapping the database row to your Deck interface
    return {
      id: data.id,
      name: data.name,
      commander: data.commander ?? null,
      partner: data.partner ?? null,
      colorIdentity: data.color_identity ?? [],
      entries: data.entries ?? [],
      objectives: data.objectives ?? [],
      versions: data.versions ?? [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
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
