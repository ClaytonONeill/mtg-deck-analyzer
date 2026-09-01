export type ManaColor = 'W' | 'U' | 'B' | 'R' | 'G' | 'C';

const COLOR_SYMBOLS: ManaColor[] = ['W', 'U', 'B', 'R', 'G', 'C'];

const BASIC_LAND_COLORS: Record<string, ManaColor> = {
  plains: 'W',
  island: 'U',
  swamp: 'B',
  mountain: 'R',
  forest: 'G',
};

export interface ManaCost {
  generic: number;
  colored: Partial<Record<ManaColor, number>>;
  hasX: boolean;
}

interface ManaSourceLike {
  name: string;
  oracle_text: string;
}

export function isLand(typeLine: string): boolean {
  return typeLine.includes('Land');
}

export function isCreatureType(typeLine: string): boolean {
  return typeLine.includes('Creature');
}

export function isPermanentType(typeLine: string): boolean {
  return /Creature|Artifact|Enchantment|Planeswalker|Battle/.test(typeLine);
}

/** One mana produced by a single tap: a fixed color, or a choice among several. */
export interface ManaPip {
  colors: ManaColor[];
}

/**
 * Pulls the "{T}: Add ..." clause out of a card's oracle text, if it has
 * one. Requiring the cost to be exactly {T} (nothing else before the
 * colon) deliberately excludes mana abilities with extra costs — sacrifice
 * (Chrome Mox), imprint, paying life, etc. — rather than mis-modeling them
 * as free taps.
 */
function extractManaAbilityClause(text: string): string | null {
  const match = (text ?? '').match(/\{T\}:\s*(Add[^.\n]*\.)/i);
  return match ? match[1] : null;
}

/**
 * Best-effort mana-production guess for a land, mana rock, or mana dork,
 * from its oracle text. Returns one pip per mana the source produces on a
 * single tap — most sources yield one pip, but fixed multi-mana sources
 * (Sol Ring, Mana Vault, ...) yield several. Doesn't model conditional
 * abilities (e.g. "if you control a Mountain") or scoped choices (Command
 * Tower's "in your commander's color identity" becomes unrestricted "any
 * color") — those get simplified rather than left unmodeled. Sources with
 * no recognizable simple tap-for-mana ability produce nothing.
 */
export function getManaAbility(source: ManaSourceLike): ManaPip[] {
  const basic = BASIC_LAND_COLORS[source.name.toLowerCase()];
  if (basic) return [{ colors: [basic] }];

  const clause = extractManaAbilityClause(source.oracle_text);
  if (!clause) return [];

  if (/any color/i.test(clause)) {
    return [{ colors: ['W', 'U', 'B', 'R', 'G'] }];
  }

  const symbols = clause.match(/\{[WUBRGC]\}/g) ?? [];
  if (symbols.length === 0) return [];

  const isChoice = /\bor\b/i.test(clause);
  if (isChoice) {
    const choices = Array.from(
      new Set(symbols.map((s) => s.slice(1, -1) as ManaColor)),
    );
    return [{ colors: choices }];
  }

  // Fixed sequence (e.g. "Add {C}{C}") — one pip per symbol occurrence.
  return symbols.map((s) => ({ colors: [s.slice(1, -1) as ManaColor] }));
}

/**
 * Parses a Scryfall mana_cost string (e.g. "{2}{U}{U}") into generic and
 * colored requirements. Hybrid/Phyrexian symbols (e.g. "{W/U}", "{R/P}")
 * are simplified to their first listed color. {X} is flagged via hasX
 * rather than resolved — X spells aren't castable in the simulator yet.
 */
export function parseManaCost(manaCost: string): ManaCost {
  const symbols = manaCost.match(/\{[^}]+\}/g) ?? [];
  let generic = 0;
  let hasX = false;
  const colored: Partial<Record<ManaColor, number>> = {};

  symbols.forEach((sym) => {
    const inner = sym.slice(1, -1).toUpperCase();
    if (/^\d+$/.test(inner)) {
      generic += parseInt(inner, 10);
      return;
    }
    if (inner === 'X') {
      hasX = true;
      return;
    }
    const colorChar = inner
      .split('/')
      .find((part) => (COLOR_SYMBOLS as string[]).includes(part));
    if (colorChar) {
      const c = colorChar as ManaColor;
      colored[c] = (colored[c] ?? 0) + 1;
    } else {
      generic += 1;
    }
  });

  return { generic, colored, hasX };
}

export interface AvailableMana {
  byColor: Record<ManaColor, number>;
  total: number;
}

/**
 * Summarizes eligible sources' mana potential for display, in pips (not
 * source count) — a Sol Ring contributes 2 to `total`. A choice pip (e.g.
 * "any color") is credited under every color it could produce, so
 * per-color counts are "up to" figures, not additive resources — `total`
 * is the real constraint. Actual payment assignment happens in tryPayCost.
 * Callers are responsible for only passing untapped, non-sick sources.
 */
export function computeAvailableMana<T extends ManaSourceLike>(
  sources: T[],
): AvailableMana {
  const byColor: Record<ManaColor, number> = {
    W: 0,
    U: 0,
    B: 0,
    R: 0,
    G: 0,
    C: 0,
  };
  let total = 0;
  sources.forEach((source) => {
    getManaAbility(source).forEach((pip) => {
      total += 1;
      pip.colors.forEach((c) => {
        byColor[c] += 1;
      });
    });
  });
  return { byColor, total };
}

/**
 * Greedily assigns pips from `sources` to pay `cost`. Colored requirements
 * are paid first, preferring the least-flexible available pip so
 * multi-color sources stay free for other pips; the generic requirement
 * then prefers pips from sources already committed to a colored pip
 * (spending a multi-mana source's leftover mana) before tapping anything
 * new. A source is "spent" (returned in sourcesToTap) if any of its pips
 * were used — its other pips, if any go unused, are simply wasted for
 * this cast, same as leftover mana in real play. Callers are responsible
 * for only passing untapped, non-sick sources.
 */
export function tryPayCost<T extends ManaSourceLike>(
  sources: T[],
  cost: ManaCost,
): { canPay: boolean; sourcesToTap: T[] } {
  if (cost.hasX) return { canPay: false, sourcesToTap: [] };

  let pool = sources.flatMap((source) =>
    getManaAbility(source).map((pip) => ({ colors: pip.colors, source })),
  );
  const tapped = new Set<T>();

  for (const [color, count] of Object.entries(cost.colored) as [
    ManaColor,
    number,
  ][]) {
    for (let i = 0; i < count; i++) {
      const candidates = pool
        .filter((p) => p.colors.includes(color))
        .sort((a, b) => a.colors.length - b.colors.length);
      const chosen = candidates[0];
      if (!chosen) return { canPay: false, sourcesToTap: [] };
      tapped.add(chosen.source);
      pool = pool.filter((p) => p !== chosen);
    }
  }

  if (pool.length < cost.generic) return { canPay: false, sourcesToTap: [] };
  pool.sort((a, b) => Number(!tapped.has(a.source)) - Number(!tapped.has(b.source)));
  for (let i = 0; i < cost.generic; i++) {
    tapped.add(pool[i].source);
  }

  return { canPay: true, sourcesToTap: Array.from(tapped) };
}
