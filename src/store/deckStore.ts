// Types
import type { Deck, DeckEntry, Objective, ScryfallCard } from '@/types';

// Lib
import { supabase } from '@/lib/supabase';

// Utils
import { inferCategory } from '@/utils/utils';
import { mergeColorIdentities } from '@/features/deckBuilder/utils/partnerUtils';

export const deckStore = {
  async getAll(): Promise<Deck[]> {
    const { data, error } = await supabase
      .from('decks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('deckStore.getAll error:', error);
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
        'deckStore.save: no authenticated user, skipping Supabase write',
      );
      return;
    }

    const { error } = await supabase.from('decks').upsert(
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
      { onConflict: 'id' },
    );

    if (error) {
      console.error('deckStore.save error:', error);
    } else {
      console.log('deckStore.save success:', deck.name);
    }
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('decks').delete().eq('id', id);

    if (error) {
      console.error('deckStore.delete error:', error);
      throw new Error('Failed to delete deck');
    } else {
      console.log('deckStore.delete success for id:', id);
    }
  },

  async getById(id: string): Promise<Deck | undefined> {
    const { data, error } = await supabase
      .from('decks')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      // Handle the case where the record simply doesn't exist
      if (error.code === 'PGRST116') return undefined;

      console.error('deckStore.getById error:', error);
      return undefined;
    }

    if (!data) return undefined;

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

export function isCardLegalForDeck(
  colorIdentity: string[],
  card: ScryfallCard,
): boolean {
  return card.color_identity.every((c) => colorIdentity.includes(c));
}

/** Cards exempt from Commander's singleton rule: basic lands, plus cards like
 * Relentless Rats whose own text allows any number of copies. */
export function isSingletonExempt(card: ScryfallCard): boolean {
  return (
    /\bBasic\b/.test(card.type_line ?? '') ||
    /a deck can have any number of cards named/i.test(card.oracle_text ?? '')
  );
}

/** Singleton check by card name (not Scryfall id), so a different printing of
 * a card already in `existingCards` still counts as a duplicate. */
export function isDuplicateCard(
  existingCards: ScryfallCard[],
  card: ScryfallCard,
): boolean {
  if (isSingletonExempt(card)) return false;
  return existingCards.some((c) => c.name === card.name);
}

export function duplicateCardInDeck(deck: Deck, card: ScryfallCard): boolean {
  const existing = [
    ...(deck.commander ? [deck.commander] : []),
    ...(deck.partner ? [deck.partner] : []),
    ...deck.entries.map((e) => e.card),
  ];
  return isDuplicateCard(existing, card);
}

/** Names of non-exempt cards appearing more than once across the commander,
 * partner, and entries (including a single entry with quantity > 1). */
export function findDuplicateCardNames(deck: Deck): string[] {
  const counts = new Map<string, number>();
  const add = (card: ScryfallCard | undefined, quantity: number) => {
    // Imported files are only loosely validated, so tolerate malformed entries.
    if (!card?.name || isSingletonExempt(card)) return;
    counts.set(card.name, (counts.get(card.name) ?? 0) + quantity);
  };
  if (deck.commander) add(deck.commander, 1);
  if (deck.partner) add(deck.partner, 1);
  deck.entries.forEach((e) => add(e?.card, e?.quantity ?? 1));
  return [...counts].filter(([, n]) => n > 1).map(([name]) => name);
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

export function getAllCardIdsInDeck(deck: Deck): string[] {
  const ids = [
    deck.commander?.id,
    deck.partner?.id,
    ...deck.entries.map((e) => e.card.id),
    ...deck.versions.flatMap((v) => v.swaps.map((s) => s.addCard.id)),
  ].filter((id): id is string => Boolean(id));

  return [...new Set(ids)];
}

export type DeckExportFormat = 'json' | 'xlsx' | 'txt';

export function defaultExportFilename(
  deck: Deck,
  format: DeckExportFormat,
): string {
  return `${deck.name.replace(/\s+/g, '_')}.${format}`;
}

/**
 * Plain "<quantity> <card name>" per line — the de facto clipboard-import
 * format supported by most deckbuilding sites (Moxfield, Archidekt, etc).
 * Commander/partner are included as ordinary lines, same as the rest of
 * the deck.
 */
export function buildDeckTextExport(deck: Deck): string {
  const lines: string[] = [];
  if (deck.commander) lines.push(`1 ${deck.commander.name}`);
  if (deck.partner) lines.push(`1 ${deck.partner.name}`);
  deck.entries.forEach((entry) => {
    lines.push(`${entry.quantity} ${entry.card.name}`);
  });
  return lines.join('\n');
}

export async function buildDeckExportBlob(
  deck: Deck,
  format: DeckExportFormat,
): Promise<Blob> {
  if (format === 'xlsx') return buildDeckXlsxBlob(deck);
  if (format === 'txt') {
    return new Blob([buildDeckTextExport(deck)], { type: 'text/plain' });
  }

  const json = JSON.stringify(deck, null, 2);
  return new Blob([json], { type: 'application/json' });
}

async function buildDeckXlsxBlob(deck: Deck): Promise<Blob> {
  // Loaded on demand — xlsx is a large dependency only needed by this format.
  const XLSX = await import('xlsx');

  const rows: Record<string, string | number>[] = [];

  const addRow = (category: string, quantity: number, card: ScryfallCard) => {
    rows.push({
      Quantity: quantity,
      Name: card.name,
      Category: category,
      'Type Line': card.type_line,
      'Mana Cost': card.mana_cost,
      CMC: card.cmc,
      'Color Identity': card.color_identity.join(''),
    });
  };

  if (deck.commander) addRow('Commander', 1, deck.commander);
  if (deck.partner) addRow('Commander', 1, deck.partner);
  deck.entries.forEach((entry) => addRow(entry.category, entry.quantity, entry.card));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Deck');
  const buffer = XLSX.write(workbook, {
    type: 'array',
    bookType: 'xlsx',
  }) as ArrayBuffer;

  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
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
          reject(new Error('Invalid deck file — missing required fields.'));
          return;
        }
        const duplicates = findDuplicateCardNames(parsed as Deck);
        if (duplicates.length > 0) {
          reject(
            new Error(
              `Invalid deck file — Commander decks can only contain one copy of: ${duplicates.join(', ')}.`,
            ),
          );
          return;
        }
        resolve(parsed as Deck);
      } catch {
        reject(
          new Error('Could not parse file. Make sure it is a valid deck JSON.'),
        );
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsText(file);
  });
}

function isValidDeck(obj: unknown): boolean {
  if (typeof obj !== 'object' || obj === null) return false;
  const d = obj as Record<string, unknown>;
  return (
    typeof d.id === 'string' &&
    typeof d.name === 'string' &&
    typeof d.createdAt === 'string' &&
    typeof d.updatedAt === 'string' &&
    Array.isArray(d.entries)
  );
}
