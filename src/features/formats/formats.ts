// Types
import type {
  Deck,
  DeckEntry,
  DeckFormat,
  DeckZone,
  ScryfallCard,
} from "@/types";

/**
 * Deck-building rules for every supported format, and the pure checks built
 * on them. This is the single source of truth: anything that adds a card to a
 * deck goes through `checkCardAdd`, and anything that reports on legality uses
 * `getDeckViolations` / `getLegalFormats`.
 *
 * Legality itself comes from Scryfall: every card carries a `legalities` map
 * (`legal | not_legal | restricted | banned` per format), so ban lists, the
 * Vintage restricted list and Pauper's rarity rule need no logic here.
 */

export interface FormatRules {
  id: DeckFormat;
  label: string;
  /** Minimum main-deck size (commander/partner included for Commander). */
  mainMin: number;
  /** Maximum main-deck size, or null for no maximum. */
  mainMax: number | null;
  sideboardMax: number;
  /** Copies of one card (by name) allowed across main + sideboard. */
  copyLimit: number;
  hasCommander: boolean;
  /** Cards must fit the commander's color identity. */
  enforcesColorIdentity: boolean;
  /** Typical land count, for the builder's stats hint. */
  landsLow: number;
  landsHigh: number;
  landsHint: string;
}

const constructed = (id: DeckFormat, label: string): FormatRules => ({
  id,
  label,
  mainMin: 60,
  mainMax: null,
  sideboardMax: 15,
  copyLimit: 4,
  hasCommander: false,
  enforcesColorIdentity: false,
  landsLow: 20,
  landsHigh: 26,
  landsHint: "22–25 typical",
});

export const FORMATS: Record<DeckFormat, FormatRules> = {
  commander: {
    id: "commander",
    label: "Commander",
    mainMin: 100,
    mainMax: 100,
    sideboardMax: 0,
    copyLimit: 1,
    hasCommander: true,
    enforcesColorIdentity: true,
    landsLow: 33,
    landsHigh: 40,
    landsHint: "36–38 typical",
  },
  standard: constructed("standard", "Standard"),
  pioneer: constructed("pioneer", "Pioneer"),
  modern: constructed("modern", "Modern"),
  legacy: constructed("legacy", "Legacy"),
  vintage: constructed("vintage", "Vintage"),
  pauper: constructed("pauper", "Pauper"),
};

/** Display and sort order. */
export const FORMAT_ORDER: DeckFormat[] = [
  "commander",
  "standard",
  "pioneer",
  "modern",
  "legacy",
  "vintage",
  "pauper",
];

export function isDeckFormat(value: unknown): value is DeckFormat {
  return typeof value === "string" && value in FORMATS;
}

/** The deck's format; decks saved before formats existed are Commander. */
export function getFormat(deck: { format?: unknown }): DeckFormat {
  return isDeckFormat(deck.format) ? deck.format : "commander";
}

export function getRules(deck: { format?: unknown }): FormatRules {
  return FORMATS[getFormat(deck)];
}

/** Live legalities by Scryfall card id, fresher than the saved snapshots. */
export type LiveLegalities = Map<string, Record<string, string>>;

export type Legality = "legal" | "restricted" | "banned" | "not_legal";

const isBasicLand = (card: ScryfallCard) =>
  /\bBasic\b/.test(card.type_line ?? "");

export function cardLegality(
  card: ScryfallCard,
  format: DeckFormat,
  live?: LiveLegalities | null,
): Legality {
  // Basics are legal everywhere. The builder's hand-made basics carry no
  // real legalities, so don't look them up.
  if (isBasicLand(card)) return "legal";
  const map = live?.get(card.id) ?? card.legalities ?? {};
  const value = map[format];
  if (value === "legal" || value === "restricted" || value === "banned") {
    return value;
  }
  return "not_legal";
}

const isPlayable = (l: Legality) => l === "legal" || l === "restricted";

const NUMBER_WORDS: Record<string, number> = {
  two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
};

/** A card's own text overriding the copy limit: "any number" (Relentless
 * Rats) or "up to seven/nine" (Seven Dwarves, Nazgûl). Null if none. */
function printedCopyLimit(card: ScryfallCard): number | null {
  const text = card.oracle_text ?? "";
  if (/a deck can have any number of cards named/i.test(text)) return Infinity;
  const m = /a deck can have up to (\w+) cards named/i.exec(text);
  if (m) {
    const n = NUMBER_WORDS[m[1].toLowerCase()] ?? Number(m[1]);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

/** Cards exempt from Commander's singleton rule: basic lands, plus cards
 * whose own text allows more copies. */
export function isSingletonExempt(card: ScryfallCard): boolean {
  return isBasicLand(card) || printedCopyLimit(card) !== null;
}

/** How many copies of this card (by name) a deck in `format` may hold. */
export function maxCopies(
  format: DeckFormat,
  card: ScryfallCard,
  live?: LiveLegalities | null,
): number {
  if (isBasicLand(card)) return Infinity;
  const legality = cardLegality(card, format, live);
  if (!isPlayable(legality)) return 0;
  if (legality === "restricted") return 1;
  return printedCopyLimit(card) ?? FORMATS[format].copyLimit;
}

type DeckLike = Pick<
  Deck,
  "commander" | "partner" | "colorIdentity" | "entries"
> & { format?: unknown; sideboard?: DeckEntry[] };

const sum = (entries: DeckEntry[] | undefined) =>
  (entries ?? []).reduce((n, e) => n + (e?.quantity ?? 0), 0);

/** Main-deck size: entries plus commander and partner. */
export function getMainCount(deck: DeckLike): number {
  return sum(deck.entries) + (deck.commander ? 1 : 0) + (deck.partner ? 1 : 0);
}

export function getSideboardCount(deck: DeckLike): number {
  return sum(deck.sideboard);
}

/** Copies of each card name across commander, partner, main and sideboard. */
export function countByName(deck: DeckLike): Map<string, number> {
  const counts = new Map<string, number>();
  const add = (card: ScryfallCard | null | undefined, qty: number) => {
    // Imported files are only loosely validated, so tolerate bad entries.
    if (!card?.name) return;
    counts.set(card.name, (counts.get(card.name) ?? 0) + qty);
  };
  add(deck.commander, 1);
  add(deck.partner, 1);
  for (const e of deck.entries ?? []) add(e?.card, e?.quantity ?? 1);
  for (const e of deck.sideboard ?? []) add(e?.card, e?.quantity ?? 1);
  return counts;
}

const fitsIdentity = (identity: string[], card: ScryfallCard) =>
  (card.color_identity ?? []).every((c) => identity.includes(c));

export type AddCheckKind = "illegal" | "color" | "copies" | "size";

export type AddCheck =
  | { ok: true }
  | { ok: false; kind: AddCheckKind; reason: string };

export interface AddCheckOptions {
  live?: LiveLegalities | null;
  /** Skip deck-size limits, e.g. for a one-for-one swap. */
  ignoreSize?: boolean;
}

/**
 * Whether one more copy of `card` may go into `zone`. Checks, in order:
 * format legality, color identity (Commander only), the copy limit (main and
 * sideboard counted together, by name) and the zone's size limit.
 */
export function checkCardAdd(
  deck: DeckLike,
  card: ScryfallCard,
  zone: DeckZone = "main",
  { live, ignoreSize = false }: AddCheckOptions = {},
): AddCheck {
  const rules = getRules(deck);
  const format = rules.id;
  const legality = cardLegality(card, format, live);

  if (!isPlayable(legality)) {
    return {
      ok: false,
      kind: "illegal",
      reason: `${card.name} is ${legality === "banned" ? "banned" : "not legal"} in ${rules.label}.`,
    };
  }
  if (
      rules.enforcesColorIdentity &&
      deck.commander &&
      !fitsIdentity(deck.colorIdentity, card)
    ) {
    return {
      ok: false,
      kind: "color",
      reason: `${card.name} is outside your commander's color identity and cannot be added.`,
    };
  }
  const limit = maxCopies(format, card, live);
  const have = countByName(deck).get(card.name) ?? 0;
  if (have + 1 > limit) {
    return {
      ok: false,
      kind: "copies",
      reason:
        limit === 1
          ? legality === "restricted"
            ? `${card.name} is restricted in ${rules.label}: only one copy allowed.`
            : `${card.name} is already in your deck.`
          : `${rules.label} allows at most ${limit} copies of ${card.name}.`,
    };
  }
  if (!ignoreSize) {
    if (zone === "side") {
      if (getSideboardCount(deck) >= rules.sideboardMax) {
        return {
          ok: false,
          kind: "size",
          reason:
            rules.sideboardMax === 0
              ? `${rules.label} decks don't use a sideboard.`
              : `The sideboard is full (${rules.sideboardMax} cards).`,
        };
      }
    } else if (rules.mainMax !== null && getMainCount(deck) >= rules.mainMax) {
      return {
        ok: false,
        kind: "size",
        reason: `The deck is full (${rules.mainMax} cards).`,
      };
    }
  }
  return { ok: true };
}

export interface Violation {
  /** The card concerned, or null for a deck-level problem. */
  cardName: string | null;
  kind: AddCheckKind | "commander";
  reason: string;
}

/** Card-level and deck-level rule breaks, ignoring "not finished yet" size
 * shortfalls (see `getLegalFormats` for those). */
function findViolations(
  deck: DeckLike,
  format: DeckFormat,
  live?: LiveLegalities | null,
): Violation[] {
  const rules = FORMATS[format];
  const out: Violation[] = [];
  const counts = countByName(deck);
  const seen = new Set<string>();

  const cards = [
    deck.commander,
    deck.partner,
    ...(deck.entries ?? []).map((e) => e?.card),
    ...(deck.sideboard ?? []).map((e) => e?.card),
  ];
  for (const card of cards) {
    if (!card?.name || seen.has(card.name)) continue;
    seen.add(card.name);
    const legality = cardLegality(card, format, live);
    if (!isPlayable(legality)) {
      out.push({
        cardName: card.name,
        kind: "illegal",
        reason: `${legality === "banned" ? "Banned" : "Not legal"} in ${rules.label}`,
      });
      continue;
    }
    if (
      rules.enforcesColorIdentity &&
      deck.commander &&
      !fitsIdentity(deck.colorIdentity, card)
    ) {
      out.push({
        cardName: card.name,
        kind: "color",
        reason: "Outside the commander's color identity",
      });
    }
    const limit = maxCopies(format, card, live);
    const have = counts.get(card.name) ?? 0;
    if (have > limit) {
      out.push({
        cardName: card.name,
        kind: "copies",
        reason: `${have} copies; ${rules.label} allows ${limit}`,
      });
    }
  }

  if (rules.hasCommander && !deck.commander) {
    out.push({ cardName: null, kind: "commander", reason: "No commander chosen" });
  }
  const side = getSideboardCount(deck);
  if (side > rules.sideboardMax) {
    out.push({
      cardName: null,
      kind: "size",
      reason:
        rules.sideboardMax === 0
          ? `${rules.label} decks don't use a sideboard`
          : `Sideboard has ${side} cards (max ${rules.sideboardMax})`,
    });
  }
  if (rules.mainMax !== null && getMainCount(deck) > rules.mainMax) {
    out.push({
      cardName: null,
      kind: "size",
      reason: `Deck has ${getMainCount(deck)} cards (max ${rules.mainMax})`,
    });
  }
  return out;
}

/** Problems with the deck in its own format. Used to flag cards after a
 * format switch or an import, instead of silently deleting them. */
export function getDeckViolations(
  deck: DeckLike,
  live?: LiveLegalities | null,
): Violation[] {
  return findViolations(deck, getFormat(deck), live);
}

export type FormatStatus = "legal" | "incomplete" | "illegal";

export interface FormatLegality {
  format: DeckFormat;
  status: FormatStatus;
  /** Why it isn't legal (illegal) or what's missing (incomplete). */
  reasons: string[];
}

/** For every format: is this deck legal there, legal-but-unfinished, or
 * not legal? Powers the "also legal in" badges. */
export function getLegalFormats(
  deck: DeckLike,
  live?: LiveLegalities | null,
): FormatLegality[] {
  return FORMAT_ORDER.map((format) => {
    const rules = FORMATS[format];
    const violations = findViolations(deck, format, live);
    if (violations.length) {
      const names = violations
        .filter((v) => v.cardName && v.kind === "illegal")
        .map((v) => v.cardName as string);
      const reasons = [
        ...(names.length
          ? [`Not legal: ${names.slice(0, 3).join(", ")}${names.length > 3 ? ` +${names.length - 3} more` : ""}`]
          : []),
        ...violations
          .filter((v) => v.kind !== "illegal")
          .map((v) => (v.cardName ? `${v.cardName}: ${v.reason}` : v.reason)),
      ];
      return { format, status: "illegal", reasons };
    }
    const main = getMainCount(deck);
    if (main < rules.mainMin) {
      return {
        format,
        status: "incomplete",
        reasons: [
          rules.mainMax === rules.mainMin
            ? `Needs exactly ${rules.mainMin} cards (has ${main})`
            : `Needs at least ${rules.mainMin} cards (has ${main})`,
        ],
      };
    }
    return { format, status: "legal", reasons: [] };
  });
}

/** The size target shown in counters: "100" or "60". */
export function mainTarget(deck: { format?: unknown }): number {
  return getRules(deck).mainMin;
}

/** Main deck has reached the format's size (exactly 100, or 60+). */
export function isMainComplete(deck: DeckLike): boolean {
  const rules = getRules(deck);
  const n = getMainCount(deck);
  return rules.mainMax === null ? n >= rules.mainMin : n === rules.mainMin;
}

const WUBRG = ["W", "U", "B", "R", "G"];

/** For non-Commander decks, set `colorIdentity` to the colors of the cards
 * in it, so Home's color filter and pips still mean something. Commander
 * decks keep their commander's identity. */
export function withDerivedColors<T extends DeckLike>(deck: T): T {
  if (getRules(deck).hasCommander) return deck;
  const colors = new Set<string>();
  for (const e of [...(deck.entries ?? []), ...(deck.sideboard ?? [])]) {
    for (const c of e?.card?.color_identity ?? []) colors.add(c);
  }
  return { ...deck, colorIdentity: WUBRG.filter((c) => colors.has(c)) };
}
