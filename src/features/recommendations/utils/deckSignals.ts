// Types
import type { DeckEntry, Objective, ScryfallCard } from "@/types";

/**
 * Everything the recommendation engine needs to know about a (version-resolved)
 * deck. Deliberately smaller than `Deck` so the swap sidebar can build one from
 * the props it already has.
 */
export interface RecInput {
  commander: ScryfallCard | null;
  partner: ScryfallCard | null;
  entries: DeckEntry[];
  colorIdentity: string[];
  /** Deck-level strategic objectives (`Deck.objectives`). */
  strategyObjectives: Objective[];
  /** All objectives, to resolve `DeckEntry.objectiveIds` to labels. */
  objectives: Objective[];
}

/** One reason to recommend cards, and the Scryfall search fragment for it. */
export interface Signal {
  id: string;
  /** Shown to the user as the "why" for cards this signal returns. */
  label: string;
  query: string;
  weight: number;
}

/** Signals plus an optional query constraint applied to every signal. */
export interface RecPlan {
  signals: Signal[];
  /** Extra Scryfall fragment ANDed onto every signal query (swap mode). */
  constraint: string;
  /** Reasons implied by the constraint, attached to every result. */
  constraintReasons: string[];
}

interface Pattern {
  id: string;
  name: string;
  test: RegExp;
  query: string;
}

// Deck themes, detected from oracle text. Queries are plain oracle-text
// searches (not Tagger `otag:`) so they can't silently break on a tag rename.
const THEMES: Pattern[] = [
  { id: "counters", name: "+1/+1 counters", test: /\+1\/\+1 counter/, query: 'o:"+1/+1 counter"' },
  { id: "tokens", name: "Tokens", test: /create[^.]*token/, query: '(o:create o:token -o:"its controller creates" -o:"that player creates")' },
  { id: "sacrifice", name: "Sacrifice", test: /sacrifice (a|an|another) /, query: '(o:"sacrifice a" or o:"sacrifice another")' },
  { id: "graveyard", name: "Graveyard", test: /from (your|a) graveyard/, query: '(o:"from your graveyard" or o:"from a graveyard")' },
  { id: "lifegain", name: "Lifegain", test: /gains? (\d+ )?life|lifelink/, query: '(o:"whenever you gain life" or kw:lifelink or o:/you gain \\d+ life/)' },
  { id: "landfall", name: "Landfall", test: /landfall|whenever a land (you control )?enters/, query: '(kw:landfall or o:"whenever a land")' },
  { id: "spellslinger", name: "Spellslinger", test: /instant or sorcery/, query: 'o:"instant or sorcery"' },
  { id: "artifacts", name: "Artifacts", test: /artifacts? you control|whenever an artifact/, query: '(o:"artifacts you control" or o:"artifact you control" or o:"whenever an artifact")' },
  { id: "enchantments", name: "Enchantments", test: /enchantments? you control|enchantment spell|constellation/, query: '(o:"enchantments you control" or o:"enchantment spell" or kw:constellation)' },
  { id: "voltron", name: "Equipment & Auras", test: /equipped creature|enchanted creature gets/, query: '(o:"equipped creature" or o:"enchanted creature gets")' },
  { id: "blink", name: "Blink", test: /exile [^.]*return (it|that card|them) to the battlefield/, query: '(o:exile (o:"return it to the battlefield" or o:"return that card to the battlefield" or o:"return them to the battlefield" or o:"return those cards to the battlefield"))' },
  { id: "mill", name: "Mill", test: /\bmills?\b/, query: "o:mill" },
];

// Staple roles every Commander deck wants some of, with rough target counts.
const ROLES: (Pattern & { target: number })[] = [
  {
    id: "ramp",
    name: "Ramp",
    test: /add \{[wubrgc]\}|add (one|two) mana|search your library for (a|up to \w+) (basic )?lands?/,
    query: '(o:"add {" or o:"search your library for a basic land" or o:"search your library for up to two basic land") -t:land',
    target: 10,
  },
  {
    id: "draw",
    name: "Card draw",
    test: /draw (a|two|three|\w+) cards?|draws? cards/,
    query: '(o:"draw a card" or o:"draw two cards" or o:"draw three cards" or o:"draws cards")',
    target: 10,
  },
  {
    id: "removal",
    name: "Removal",
    test: /(destroy|exile) target (creature|artifact|enchantment|permanent|nonland|planeswalker)|deals? \d+ damage to (target|any target)/,
    query: '(o:"destroy target" or o:"exile target") -t:land',
    target: 8,
  },
  {
    id: "wipe",
    name: "Board wipes",
    test: /(destroy|exile) all |all creatures get -/,
    query: '(o:"destroy all" or o:"exile all") -t:land',
    target: 2,
  },
];

// Freeform objective labels -> the theme/role they most likely mean.
// First match wins. A null target means "recognized, but no search for it
// yet", so e.g. "Counterspell" isn't misread as +1/+1 counters or spells.
const OBJECTIVE_SYNONYMS: [RegExp, string | null][] = [
  [/counterspell|counter ?magic/i, null],
  [/ramp|mana|accelerat/i, "ramp"],
  [/draw|card advantage|cards/i, "draw"],
  [/removal|kill|interact|answer/i, "removal"],
  [/wipe|sweep|wrath|board ?clear/i, "wipe"],
  [/token|go ?wide/i, "tokens"],
  // Not bare /counter/: "Counterspell" is interaction, not +1/+1 counters.
  [/\+1\/\+1|\bcounters\b/i, "counters"],
  [/sac|aristocrat/i, "sacrifice"],
  [/graveyard|reanimat|recur/i, "graveyard"],
  [/life/i, "lifegain"],
  [/landfall|lands matter/i, "landfall"],
  [/spell|instant|sorcery/i, "spellslinger"],
  [/artifact/i, "artifacts"],
  [/enchant/i, "enchantments"],
  [/voltron|equip|aura/i, "voltron"],
  [/blink|flicker/i, "blink"],
  [/mill/i, "mill"],
];

const ALL_PATTERNS = [...THEMES, ...ROLES];

const MAX_SIGNALS = 4;

/** Lowercased rules text of a card, including every face of a DFC. */
export function cardText(card: ScryfallCard): string {
  return [card.oracle_text, ...(card.card_faces ?? []).map((f) => f.oracle_text)]
    .filter(Boolean)
    .join("\n")
    .toLowerCase();
}

function frontTypeLine(card: ScryfallCard): string {
  return card.type_line || card.card_faces?.[0]?.type_line || "";
}

function isLand(card: ScryfallCard): boolean {
  return /\bLand\b/.test(frontTypeLine(card));
}

function creatureTypes(card: ScryfallCard): string[] {
  const line = frontTypeLine(card);
  if (!/\bCreature\b/.test(line) || !line.includes("—")) return [];
  return line.split("—")[1].trim().split(/\s+/);
}

/** Maps an objective label to a theme/role pattern id, if it's recognizable. */
export function objectivePatternId(label: string): string | null {
  return OBJECTIVE_SYNONYMS.find(([re]) => re.test(label))?.[1] ?? null;
}

function colorQuery(colorIdentity: string[]): string {
  return `id<=${colorIdentity.length ? colorIdentity.join("") : "C"}`;
}

/** Commander(s) plus the 99, with quantity, as a flat (card, weight) list. */
function weightedCards(input: RecInput): { card: ScryfallCard; n: number }[] {
  const commanders = [input.commander, input.partner].filter(
    (c): c is ScryfallCard => c !== null,
  );
  return [
    // The commander defines the deck, so its text counts triple.
    ...commanders.map((card) => ({ card, n: 3 })),
    ...input.entries.map((e) => ({ card: e.card, n: e.quantity })),
  ];
}

interface Detected {
  themes: { pattern: Pattern; count: number; fromCommander: boolean }[];
  roles: { pattern: (typeof ROLES)[number]; count: number }[];
  tribes: { type: string; count: number }[];
}

function detect(input: RecInput): Detected {
  const cards = weightedCards(input);
  const texts = cards.map(({ card, n }) => ({ text: cardText(card), n, card }));
  const commanderText = [input.commander, input.partner]
    .filter((c): c is ScryfallCard => c !== null)
    .map(cardText)
    .join("\n");

  const themes = THEMES.map((pattern) => ({
    pattern,
    count: texts.reduce((sum, t) => sum + (pattern.test.test(t.text) ? t.n : 0), 0),
    fromCommander: pattern.test.test(commanderText),
  }));

  // Roles count only the 99 (not commanders), and ramp ignores lands.
  const roles = ROLES.map((pattern) => ({
    pattern,
    count: input.entries.reduce(
      (sum, e) =>
        sum +
        (pattern.test.test(cardText(e.card)) &&
        !(pattern.id === "ramp" && isLand(e.card))
          ? e.quantity
          : 0),
      0,
    ),
  }));

  const typeCounts = new Map<string, number>();
  let creatureCount = 0;
  for (const e of input.entries) {
    const types = creatureTypes(e.card);
    if (types.length) creatureCount += e.quantity;
    for (const t of types) typeCounts.set(t, (typeCounts.get(t) ?? 0) + e.quantity);
  }
  const tribes = [...typeCounts]
    .filter(([, n]) => n >= 8 || (n >= 5 && n / Math.max(creatureCount, 1) >= 0.25))
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  return { themes, roles, tribes };
}

/** Objective labels in play: strategy objectives, plus card-level objectives
 * tagged on at least 3 cards (a single stray tag isn't a deck priority). */
function objectiveLabels(input: RecInput): { label: string; weight: number }[] {
  const byId = new Map(input.objectives.map((o) => [o.id, o]));
  const cardTagCounts = new Map<string, number>();
  for (const e of input.entries) {
    for (const id of e.objectiveIds ?? []) {
      cardTagCounts.set(id, (cardTagCounts.get(id) ?? 0) + 1);
    }
  }
  return [
    ...input.strategyObjectives.map((o) => ({ label: o.label, weight: 1 })),
    ...[...cardTagCounts]
      .filter(([, n]) => n >= 3)
      .map(([id]) => byId.get(id))
      .filter((o): o is Objective => !!o)
      .map((o) => ({ label: o.label, weight: 0.5 })),
  ];
}

/** Applies objective boosts onto `signals` (mutating a copy), adding a signal
 * for a matched pattern that didn't qualify on its own. */
function applyObjectives(signals: Signal[], input: RecInput): Signal[] {
  const out = signals.map((s) => ({ ...s }));
  for (const { label, weight } of objectiveLabels(input)) {
    const id = objectivePatternId(label);
    const pattern = ALL_PATTERNS.find((p) => p.id === id);
    if (!pattern) continue;
    const existing = out.find((s) => s.id === pattern.id);
    if (existing) {
      existing.weight += weight;
      if (!existing.label.includes("objective")) {
        existing.label += ` · objective "${label}"`;
      }
    } else {
      out.push({
        id: pattern.id,
        label: `Objective: ${label}`,
        query: pattern.query,
        weight: 0.8 + weight,
      });
    }
  }
  return out;
}

function topSignals(signals: Signal[]): Signal[] {
  return [...signals].sort((a, b) => b.weight - a.weight).slice(0, MAX_SIGNALS);
}

const POPULAR: Signal = {
  id: "popular",
  label: "Popular in your colors",
  query: "-t:land",
  weight: 0.5,
};

/** Signals for general, deck-level suggestions. Works with or without
 * objectives: themes, tribes, and role gaps come from the cards themselves. */
export function buildDeckPlan(input: RecInput): RecPlan {
  const { themes, roles, tribes } = detect(input);
  const signals: Signal[] = [];

  for (const { pattern, count, fromCommander } of themes) {
    if (count < 5 && !fromCommander) continue;
    signals.push({
      id: pattern.id,
      label: fromCommander
        ? `Commander synergy: ${pattern.name}`
        : `${pattern.name} theme (${count} cards)`,
      query: pattern.query,
      weight: Math.min(count / 10, 1.5) + (fromCommander ? 1 : 0),
    });
  }

  for (const { type, count } of tribes.slice(0, 1)) {
    signals.push({
      id: `tribe-${type}`,
      label: `${type} tribal (${count} in deck)`,
      query: `t:"${type}"`,
      weight: Math.min(count / 10, 1.5) + 0.5,
    });
  }

  for (const { pattern, count } of roles) {
    const gap = pattern.target - count;
    if (gap <= 0) continue;
    signals.push({
      id: pattern.id,
      label: `${pattern.name}: deck has ${count} (aim ~${pattern.target})`,
      query: pattern.query,
      weight: (gap / pattern.target) * 1.2,
    });
  }

  const chosen = topSignals(applyObjectives(signals, input));
  return {
    signals: chosen.length ? chosen : [POPULAR],
    constraint: "",
    constraintReasons: [],
  };
}

const PRIMARY_TYPES = [
  "Creature",
  "Planeswalker",
  "Instant",
  "Sorcery",
  "Artifact",
  "Enchantment",
  "Battle",
  "Land",
];

/** The card's primary type (Creature, Instant, ...), if any. */
export function primaryType(card: ScryfallCard): string | undefined {
  const line = frontTypeLine(card);
  return PRIMARY_TYPES.find((t) => line.includes(t));
}

/** Ids of the staple roles (ramp, draw, removal, wipe) a card fills. */
export function cardRoles(card: ScryfallCard): string[] {
  const text = cardText(card);
  return ROLES.filter(
    (p) => p.test.test(text) && !(p.id === "ramp" && isLand(card)),
  ).map((p) => p.id);
}

/** Signals for replacing one specific card: same role, same type, similar
 * cost, and whichever of the deck's themes the outgoing card shares. */
export function buildSwapPlan(input: RecInput, target: ScryfallCard): RecPlan {
  const text = cardText(target);
  const typeLine = frontTypeLine(target);
  const primaryType = PRIMARY_TYPES.find((t) => typeLine.includes(t));
  const signals: Signal[] = [];

  for (const pattern of ROLES) {
    if (pattern.id === "ramp" && isLand(target)) continue;
    if (!pattern.test.test(text)) continue;
    signals.push({
      id: pattern.id,
      label: `Same role: ${pattern.name}`,
      query: pattern.query,
      weight: 1.5,
    });
  }

  // Objectives tagged on the outgoing card say what job it was doing.
  const entry = input.entries.find((e) => e.card.id === target.id);
  const byId = new Map(input.objectives.map((o) => [o.id, o]));
  for (const id of entry?.objectiveIds ?? []) {
    const label = byId.get(id)?.label;
    const pattern = ALL_PATTERNS.find((p) => p.id === objectivePatternId(label ?? ""));
    if (!label || !pattern || signals.some((s) => s.id === pattern.id)) continue;
    signals.push({
      id: pattern.id,
      label: `Same objective: ${label}`,
      query: pattern.query,
      weight: 1.4,
    });
  }

  const deckPlan = buildDeckPlan(input);
  for (const pattern of THEMES) {
    if (!pattern.test.test(text)) continue;
    if (!deckPlan.signals.some((s) => s.id === pattern.id)) continue;
    if (signals.some((s) => s.id === pattern.id)) continue;
    signals.push({
      id: pattern.id,
      label: `Keeps ${pattern.name} theme`,
      query: pattern.query,
      weight: 1.2,
    });
  }

  const tribe = creatureTypes(target).find((t) =>
    deckPlan.signals.some((s) => s.id === `tribe-${t}`),
  );
  if (tribe) {
    signals.push({
      id: `tribe-${tribe}`,
      label: `Keeps ${tribe} tribal`,
      query: `t:"${tribe}"`,
      weight: 1.3,
    });
  }

  // Nothing specific detected: fall back to the deck's own top themes.
  if (signals.length === 0) signals.push(...deckPlan.signals.slice(0, 2));

  const constraints: string[] = [];
  const constraintReasons: string[] = [];
  if (primaryType) {
    constraints.push(`t:${primaryType.toLowerCase()}`);
    const t = primaryType.toLowerCase();
    constraintReasons.push(`Also ${/^[aeiou]/.test(t) ? "an" : "a"} ${t}`);
  }
  if (primaryType !== "Land") {
    const cmc = Math.round(target.cmc ?? 0);
    constraints.push(`cmc>=${Math.max(cmc - 1, 0)} cmc<=${cmc + 1}`);
    constraintReasons.push(`Similar cost (${cmc})`);
  }

  return {
    signals: topSignals(signals),
    constraint: constraints.join(" "),
    constraintReasons,
  };
}

/** Full Scryfall query for one signal. */
export function signalQuery(
  plan: RecPlan,
  signal: Signal,
  colorIdentity: string[],
): string {
  return [
    `(${signal.query})`,
    plan.constraint,
    colorQuery(colorIdentity),
    "f:commander",
    "-t:basic",
  ]
    .filter(Boolean)
    .join(" ");
}
