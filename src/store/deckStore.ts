// Types
import type {
  Deck,
  DeckEntry,
  DeckFormat,
  DeckZone,
  Objective,
  ScryfallCard,
} from "@/types";

// Lib
import { supabase } from "@/lib/supabase";

// Utils
import { inferCategory } from "@/utils/utils";
import { mergeColorIdentities } from "@/features/deckBuilder/utils/partnerUtils";
import {
  FORMATS,
  checkCardAdd,
  getDeckViolations,
  getFormat,
  getMainCount,
  getRules,
  isDeckFormat,
  isSingletonExempt,
  withDerivedColors,
} from "@/features/formats/formats";

// Re-exported so existing imports keep working; the rules live with the
// other format rules.
export { isSingletonExempt, getSideboardCount } from "@/features/formats/formats";

interface DeckRow {
  id: string;
  name: string;
  format: string | null;
  commander: ScryfallCard | null;
  partner: ScryfallCard | null;
  color_identity: string[] | null;
  entries: DeckEntry[] | null;
  sideboard: DeckEntry[] | null;
  objectives: Objective[] | null;
  versions: Deck["versions"] | null;
  created_at: string;
  updated_at: string;
}

function rowToDeck(row: DeckRow): Deck {
  return {
    id: row.id,
    name: row.name,
    format: getFormat(row),
    commander: row.commander ?? null,
    partner: row.partner ?? null,
    colorIdentity: row.color_identity ?? [],
    entries: row.entries ?? [],
    sideboard: row.sideboard ?? [],
    objectives: row.objectives ?? [],
    versions: row.versions ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

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

    return ((data ?? []) as DeckRow[]).map(rowToDeck);
  },

  async save(deck: Deck): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("deckStore.save: no authenticated user");
    }

    const { error } = await supabase.from("decks").upsert(
      {
        id: deck.id,
        user_id: user.id,
        name: deck.name,
        format: getFormat(deck),
        commander: deck.commander,
        partner: deck.partner,
        color_identity: deck.colorIdentity,
        entries: deck.entries,
        sideboard: deck.sideboard ?? [],
        objectives: deck.objectives,
        versions: deck.versions,
        created_at: deck.createdAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );

    if (error) {
      console.error("deckStore.save error:", error);
      throw new Error("Failed to save deck");
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
      .maybeSingle();

    if (error) {
      // Handle the case where the record simply doesn't exist
      if (error.code === "PGRST116") return undefined;

      console.error("deckStore.getById error:", error);
      return undefined;
    }

    if (!data) return undefined;

    return rowToDeck(data as DeckRow);
  },
};

export function createNewDeck(
  name: string,
  format: DeckFormat = "commander",
): Deck {
  return {
    id: crypto.randomUUID(),
    name,
    format,
    commander: null,
    partner: null,
    colorIdentity: [],
    entries: [],
    sideboard: [],
    objectives: [],
    versions: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
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

/**
 * Switch a deck to another format without losing cards. Commander →
 * 60-card moves the commander and partner into the main deck; 60-card →
 * Commander leaves the commander slot empty to pick. Cards that break the
 * new format's rules stay in the deck and are flagged (see
 * `getDeckViolations`), so switching back undoes the change.
 */
export function changeDeckFormat(deck: Deck, format: DeckFormat): Deck {
  if (getFormat(deck) === format) return deck;
  let next: Deck = { ...deck, format, sideboard: deck.sideboard ?? [] };

  if (!FORMATS[format].hasCommander) {
    for (const card of [deck.commander, deck.partner]) {
      if (card) next = addCardToDeck(next, card);
    }
    next = { ...next, commander: null, partner: null };
  } else {
    next = { ...next, colorIdentity: [] };
  }

  return { ...withDerivedColors(next), updatedAt: new Date().toISOString() };
}

export function addStrategicObjective(deck: Deck, objective: Objective): Deck {
  if (deck.objectives.some((o) => o.id === objective.id)) return deck;
  return {
    ...deck,
    objectives: [...deck.objectives, objective],
    updatedAt: new Date().toISOString(),
  };
}

export function removeStrategicObjective(
  deck: Deck,
  objectiveId: string,
): Deck {
  return {
    ...deck,
    objectives: deck.objectives.filter((o) => o.id !== objectiveId),
    updatedAt: new Date().toISOString(),
  };
}

const zoneKey = (zone: DeckZone) => (zone === "side" ? "sideboard" : "entries");

/** Add one copy of `card` to the main deck or sideboard. Does not validate:
 * callers check `checkCardAdd` first. */
export function addCardToDeck(
  deck: Deck,
  card: ScryfallCard,
  zone: DeckZone = "main",
): Deck {
  const key = zoneKey(zone);
  const list = deck[key] ?? [];
  const category = inferCategory(card);
  const existing = list.findIndex((e) => e.card.id === card.id);

  const updated: DeckEntry[] =
    existing >= 0
      ? list.map((e, i) =>
          i === existing ? { ...e, quantity: e.quantity + 1 } : e,
        )
      : [...list, { card, quantity: 1, category, objectiveIds: [] }];

  return withDerivedColors({
    ...deck,
    [key]: updated,
    updatedAt: new Date().toISOString(),
  });
}

/** Remove one copy of the card with this id from the given zone. */
export function removeCardFromDeck(
  deck: Deck,
  cardId: string,
  zone: DeckZone = "main",
): Deck {
  const key = zoneKey(zone);
  const updated = (deck[key] ?? [])
    .map((e) => (e.card.id === cardId ? { ...e, quantity: e.quantity - 1 } : e))
    .filter((e) => e.quantity > 0);
  return withDerivedColors({
    ...deck,
    [key]: updated,
    updatedAt: new Date().toISOString(),
  });
}

/** Move one copy between main deck and sideboard. */
export function moveCardBetweenZones(
  deck: Deck,
  cardId: string,
  from: DeckZone,
): Deck {
  const entry = (deck[zoneKey(from)] ?? []).find((e) => e.card.id === cardId);
  if (!entry) return deck;
  const to: DeckZone = from === "main" ? "side" : "main";
  return addCardToDeck(removeCardFromDeck(deck, cardId, from), entry.card, to);
}

/** Commander color-identity check. Always true outside Commander. */
export function isCardLegalForDeck(
  colorIdentity: string[],
  card: ScryfallCard,
  format: DeckFormat = "commander",
): boolean {
  if (!FORMATS[format].enforcesColorIdentity) return true;
  return card.color_identity.every((c) => colorIdentity.includes(c));
}

/** True when adding one more copy of `card` would break the deck's copy
 * limit (singleton in Commander, 4 elsewhere, 1 for restricted cards). */
export function duplicateCardInDeck(deck: Deck, card: ScryfallCard): boolean {
  const check = checkCardAdd(deck, card, "main", { ignoreSize: true });
  return !check.ok && check.kind === "copies";
}

/** Singleton check by card name (not Scryfall id), so a different printing of
 * a card already in `existingCards` still counts as a duplicate. Commander
 * only; 60-card formats use `checkCardAdd`. */
export function isDuplicateCard(
  existingCards: ScryfallCard[],
  card: ScryfallCard,
): boolean {
  if (isSingletonExempt(card)) return false;
  return existingCards.some((c) => c.name === card.name);
}

/** Main-deck size: entries plus commander and partner (sideboard excluded). */
export function getDeckCardCount(deck: Deck): number {
  return getMainCount(deck);
}

export function getAllCardIdsInDeck(deck: Deck): string[] {
  const ids = [
    deck.commander?.id,
    deck.partner?.id,
    ...deck.entries.map((e) => e.card.id),
    ...(deck.sideboard ?? []).map((e) => e.card.id),
    ...deck.versions.flatMap((v) => v.swaps.map((s) => s.addCard.id)),
  ].filter((id): id is string => Boolean(id));

  return [...new Set(ids)];
}

export type DeckExportFormat = "json" | "xlsx" | "txt";

export function defaultExportFilename(
  deck: Deck,
  format: DeckExportFormat,
): string {
  return `${deck.name.replace(/\s+/g, "_")}.${format}`;
}

/**
 * Plain "<quantity> <card name>" per line — the de facto clipboard-import
 * format supported by most deckbuilding sites (Moxfield, Archidekt, etc).
 * Sections follow MTG Arena: commander/partner under "Commander" (so
 * importers like endstep.cc seat them in the command zone), the main deck
 * under "Deck", and any sideboard under "Sideboard".
 */
export function buildDeckTextExport(deck: Deck): string {
  const lines: string[] = [];
  const sideboard = deck.sideboard ?? [];
  const hasCommander = !!(deck.commander || deck.partner);
  if (hasCommander) {
    lines.push("Commander");
    if (deck.commander) lines.push(`1 ${deck.commander.name}`);
    if (deck.partner) lines.push(`1 ${deck.partner.name}`);
    lines.push("");
  }
  if (hasCommander || sideboard.length) lines.push("Deck");
  deck.entries.forEach((entry) => {
    lines.push(`${entry.quantity} ${entry.card.name}`);
  });
  if (sideboard.length) {
    lines.push("", "Sideboard");
    sideboard.forEach((entry) => {
      lines.push(`${entry.quantity} ${entry.card.name}`);
    });
  }
  return lines.join("\n");
}

export async function buildDeckExportBlob(
  deck: Deck,
  format: DeckExportFormat,
): Promise<Blob> {
  if (format === "xlsx") return buildDeckXlsxBlob(deck);
  if (format === "txt") {
    return new Blob([buildDeckTextExport(deck)], { type: "text/plain" });
  }

  const json = JSON.stringify(deck, null, 2);
  return new Blob([json], { type: "application/json" });
}

async function buildDeckXlsxBlob(deck: Deck): Promise<Blob> {
  // Loaded on demand — xlsx is a large dependency only needed by this format.
  const XLSX = await import("xlsx");

  const rows: Record<string, string | number>[] = [];

  const addRow = (category: string, quantity: number, card: ScryfallCard) => {
    rows.push({
      Quantity: quantity,
      Name: card.name,
      Category: category,
      "Type Line": card.type_line,
      "Mana Cost": card.mana_cost,
      CMC: card.cmc,
      "Color Identity": card.color_identity.join(""),
    });
  };

  if (deck.commander) addRow("Commander", 1, deck.commander);
  if (deck.partner) addRow("Commander", 1, deck.partner);
  deck.entries.forEach((entry) =>
    addRow(entry.category, entry.quantity, entry.card),
  );
  (deck.sideboard ?? []).forEach((entry) =>
    addRow("Sideboard", entry.quantity, entry.card),
  );

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Deck");
  const buffer = XLSX.write(workbook, {
    type: "array",
    bookType: "xlsx",
  }) as ArrayBuffer;

  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

/**
 * Read a deck JSON export. A file is rejected if it is malformed, or if it
 * breaks its own format's copy limit (singleton for Commander, per
 * tasks/021). Other rule breaks, such as banned cards or cards outside the
 * color identity, import and are flagged in the builder, the same as after
 * a format switch. Files from before formats existed import as Commander.
 */
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
        const deck = normalizeImportedDeck(parsed as Deck);
        const overLimit = getDeckViolations(deck)
          .filter((v) => v.kind === "copies" && v.cardName)
          .map((v) => v.cardName as string);
        if (overLimit.length > 0) {
          const rules = getRules(deck);
          reject(
            new Error(
              rules.copyLimit === 1
                ? `Invalid deck file — ${rules.label} decks can only contain one copy of: ${overLimit.join(", ")}.`
                : `Invalid deck file — too many copies for ${rules.label} of: ${overLimit.join(", ")}.`,
            ),
          );
          return;
        }
        resolve(deck);
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

function normalizeImportedDeck(raw: Deck): Deck {
  const isEntry = (e: unknown): e is DeckEntry =>
    typeof e === "object" &&
    e !== null &&
    typeof (e as DeckEntry).card?.name === "string";
  const deck: Deck = {
    ...raw,
    format: isDeckFormat(raw.format) ? raw.format : "commander",
    commander: raw.commander ?? null,
    partner: raw.partner ?? null,
    colorIdentity: Array.isArray(raw.colorIdentity) ? raw.colorIdentity : [],
    entries: raw.entries.filter(isEntry),
    sideboard: Array.isArray(raw.sideboard) ? raw.sideboard.filter(isEntry) : [],
    objectives: Array.isArray(raw.objectives) ? raw.objectives : [],
    versions: Array.isArray(raw.versions) ? raw.versions : [],
  };
  return getRules(deck).hasCommander ? deck : withDerivedColors(deck);
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
