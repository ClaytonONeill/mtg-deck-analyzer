// Types
import type { ScryfallCard } from "@/types";
import type { EdhrecPage, EdhrecCandidate } from "./edhrecClient";
import type { DeckProfile, RecInput } from "./deckSignals";
import type { Recommendation } from "./scryfallRecs";

// Utils
import {
  cardRoles,
  cardThemes,
  creatureTypes,
  labelMatchesTheme,
  primaryType,
  themesForPattern,
} from "./deckSignals";
import { diversify, getCachedCard } from "./scryfallRecs";

/**
 * Blends EDHREC's view of the commander with the deck's own cards and tags.
 *
 * EDHREC supplies the candidates (what decks with this commander actually
 * play) and two numbers per card: synergy (played here more than in other
 * decks of these colors) and inclusion (share of decks playing it). Synergy
 * outweighs inclusion so commander-specific cards beat color staples. Then
 * every candidate, plus the Scryfall-search ones, is re-ranked by how well it
 * fits this deck: its themes, tribe, role gaps, and the user's objectives.
 */

export type RecMode = "top" | "gems";

/** "Top picks" ranks as described above; "Hidden gems" discounts cards most
 * decks already play, so high-synergy, rarely-played cards rise. */
const GEMS_EXPONENT = 1.5;

const W_SYNERGY = 2;
const W_INCLUSION = 0.6;
const W_THEME = 1.5;
const W_FIT = 0.6;
const W_TAG = 1;
const W_GAP = 0.6;
const W_SEARCH = 1;
const W_AGREE = 0.3;
const W_SAME_ROLE = 1.2;

/** EDHREC candidates worth hydrating from Scryfall (deeper ones rarely rank). */
const COMMANDER_POOL = 120;
const THEME_POOL = 25;
/** Theme pages fetched for deck-resemblance checks (plus any tags match). */
const TOP_THEMES = 4;
const MAX_THEME_PAGES = 6;
const MAX_CHOSEN_THEMES = 2;

export interface EdhrecSources {
  /** Short commander name for reasons ("Yarok"). */
  commanderName: string;
  page: EdhrecPage;
  /** Theme slug -> that commander+theme page (only those that loaded). */
  themePages: Map<string, EdhrecPage>;
}

export interface ChosenTheme {
  slug: string;
  label: string;
  weight: number;
  /** Why this build was picked, shown in "Based on". */
  why: string;
}

/** "Yarok, the Desecrated" -> "Yarok"; partners -> "Thrasios & Tymna". */
export function shortCommanderName(input: RecInput): string {
  return [input.commander, input.partner]
    .filter((c): c is ScryfallCard => c !== null)
    .map((c) => c.name.split(" // ")[0].split(",")[0])
    .join(" & ");
}

const pct = (n: number) => `${Math.round(n * 100)}%`;

/** Front-face name, lowercased: EDHREC and Scryfall agree on that. */
const nameKey = (name: string) => name.split(" // ")[0].toLowerCase();

/** EDHREC themes the user's tags or the deck's cards point at, if the
 * commander has them. */
function matchedThemes(page: EdhrecPage, profile: DeckProfile): ChosenTheme[] {
  const out: ChosenTheme[] = [];
  for (const o of profile.objectives) {
    const mapped = o.patternId ? themesForPattern(o.patternId) : [];
    const theme = page.themes.find(
      (t) => labelMatchesTheme(o.label, t) || mapped.includes(t.slug),
    );
    if (theme) {
      out.push({
        slug: theme.slug,
        label: theme.label,
        weight: o.weight === 1 ? 1 : 0.8,
        why: `your "${o.label}" objective`,
      });
    }
  }
  const deckThemes = [
    ...profile.themes.map((t) => ({ id: t.id, name: t.name, strength: t.strength })),
    ...(profile.tribe
      ? [{ id: `tribe-${profile.tribe}`, name: profile.tribe, strength: 0.8 }]
      : []),
  ];
  for (const t of deckThemes) {
    const mapped = themesForPattern(t.id);
    const theme = page.themes.find((pt) => mapped.includes(pt.slug));
    if (theme) {
      out.push({
        slug: theme.slug,
        label: theme.label,
        weight: 0.7 * t.strength,
        why: `your ${t.name} cards`,
      });
    }
  }
  return out;
}

/** Theme pages worth loading: the commander's most popular builds (to see
 * which one this deck resembles) plus any build the tags or cards name. */
export function themesToFetch(page: EdhrecPage, profile: DeckProfile): string[] {
  const slugs = [
    ...matchedThemes(page, profile).map((t) => t.slug),
    ...page.themes.slice(0, TOP_THEMES).map((t) => t.slug),
  ];
  return [...new Set(slugs)].slice(0, MAX_THEME_PAGES).sort();
}

/**
 * Which EDHREC build(s) to lean toward: one the user tagged, one the deck's
 * cards point at, or, failing those, whichever popular build already shares
 * the most cards with this deck. The deck-resemblance check is what lets a
 * Yarok deck full of ETB creatures lean ETB and one full of fetchlands lean
 * Landfall.
 */
export function chooseThemes(
  sources: EdhrecSources,
  input: RecInput,
  profile: DeckProfile,
): ChosenTheme[] {
  const chosen = matchedThemes(sources.page, profile);

  const base = new Map(sources.page.candidates.map((c) => [nameKey(c.name), c.inclusion]));
  const deckNames = input.entries.map((e) => nameKey(e.card.name));
  for (const [slug, themePage] of sources.themePages) {
    const byName = new Map(themePage.candidates.map((c) => [nameKey(c.name), c.inclusion]));
    // Cards this build plays noticeably more than the commander overall.
    const resemblance = deckNames.reduce(
      (sum, name) => sum + Math.max(0, (byName.get(name) ?? 0) - (base.get(name) ?? 0)),
      0,
    );
    if (resemblance < 1.5) continue;
    const theme = sources.page.themes.find((t) => t.slug === slug);
    chosen.push({
      slug,
      label: theme?.label ?? slug,
      weight: Math.min(resemblance / 4, 1) * 0.9,
      why: "your deck already looks like it",
    });
  }

  const best = new Map<string, ChosenTheme>();
  for (const t of chosen) {
    if (!sources.themePages.has(t.slug)) continue;
    const prev = best.get(t.slug);
    if (!prev || t.weight > prev.weight) best.set(t.slug, t);
  }
  return [...best.values()]
    .filter((t) => t.weight >= 0.35)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, MAX_CHOSEN_THEMES);
}

/** Scryfall ids to hydrate before blending. */
export function idsToHydrate(sources: Omit<EdhrecSources, "commanderName">): string[] {
  const top = (cands: EdhrecCandidate[], n: number) =>
    [...cands]
      .sort((a, b) => b.synergy + 0.3 * b.inclusion - (a.synergy + 0.3 * a.inclusion))
      .slice(0, n)
      .map((c) => c.scryfallId);
  return [
    ...top(sources.page.candidates, COMMANDER_POOL),
    ...[...sources.themePages.values()].flatMap((p) => top(p.candidates, THEME_POOL)),
  ];
}

// Per-card regex work is the same every render; memoize it.
const traits = new WeakMap<
  ScryfallCard,
  { themes: string[]; roles: string[]; types: string[]; primary?: string }
>();
function traitsOf(card: ScryfallCard) {
  let t = traits.get(card);
  if (!t) {
    t = {
      themes: cardThemes(card),
      roles: cardRoles(card),
      types: creatureTypes(card),
      primary: primaryType(card),
    };
    traits.set(card, t);
  }
  return t;
}

interface Part {
  value: number;
  reason?: string;
}

export interface BlendArgs {
  profile: DeckProfile;
  edhrec: EdhrecSources | null;
  themes: ChosenTheme[];
  /** Scryfall-search results from the signal engine (already ranked). */
  search: Recommendation[];
  mode: RecMode;
  /** Swap mode: the card being replaced, plus the reasons its constraints add. */
  target: ScryfallCard | null;
  constraintReasons: string[];
  /** Cards to leave out (already in the deck, wrong colors). Applied before
   * diversifying so they don't use up a card type's early slots. */
  isExcluded: (card: ScryfallCard) => boolean;
}

function fitsSwap(card: ScryfallCard, target: ScryfallCard): boolean {
  const type = traitsOf(target).primary;
  if (type && traitsOf(card).primary !== type) return false;
  if (type === "Land") return true;
  return Math.abs((card.cmc ?? 0) - Math.round(target.cmc ?? 0)) <= 1;
}

export function blend({
  profile,
  edhrec,
  themes,
  search,
  mode,
  target,
  constraintReasons,
  isExcluded,
}: BlendArgs): Recommendation[] {
  const name = edhrec?.commanderName ?? "";
  // Keyed by name: search results can be a different printing than EDHREC's.
  const base = new Map(edhrec?.page.candidates.map((c) => [nameKey(c.name), c]) ?? []);
  const themeCands = themes.map((t) => ({
    theme: t,
    byName: new Map(
      edhrec?.themePages.get(t.slug)?.candidates.map((c) => [nameKey(c.name), c]) ?? [],
    ),
  }));
  const searchTop = Math.max(...search.map((r) => r.score), 1e-9);
  const targetRoles = target ? traitsOf(target).roles : [];
  const deckThemeIds = new Set(profile.themes.map((t) => t.id));

  // Candidate cards by name: EDHREC (commander page + chosen builds) and search.
  const cards = new Map<string, ScryfallCard>();
  const edhrecIds = [base, ...themeCands.map((t) => t.byName)].flatMap((m) =>
    [...m.values()].map((c) => c.scryfallId),
  );
  for (const id of edhrecIds) {
    const card = getCachedCard(id);
    if (card && card.legalities?.commander === "legal") cards.set(nameKey(card.name), card);
  }
  const searchByName = new Map(search.map((r) => [nameKey(r.card.name), r]));
  for (const r of search) {
    if (!cards.has(nameKey(r.card.name))) cards.set(nameKey(r.card.name), r.card);
  }

  const recs: Recommendation[] = [];
  for (const card of cards.values()) {
    if (isExcluded(card) || /\bBasic\b/.test(card.type_line ?? "")) continue;
    if (target && (card.name === target.name || !fitsSwap(card, target))) continue;

    const t = traitsOf(card);
    const parts: Part[] = [];
    const key = nameKey(card.name);
    const ed = base.get(key);
    const hit = searchByName.get(key);
    let sources = 0;

    // Commander fit, from EDHREC.
    let inclusion = 0.5; // unknown to EDHREC: treated as middling for gems mode
    if (ed) {
      sources++;
      inclusion = ed.inclusion;
      const synergy = Math.max(-0.2, Math.min(ed.synergy, 0.6)) / 0.6;
      parts.push({
        value: W_SYNERGY * synergy,
        reason: ed.synergy >= 0.1 ? `+${pct(ed.synergy)} synergy with ${name}` : undefined,
      });
      parts.push({
        value: W_INCLUSION * ed.inclusion,
        reason: ed.inclusion >= 0.3 ? `In ${pct(ed.inclusion)} of ${name} decks` : undefined,
      });
    }

    // Chosen builds (tagged, deck-implied, or resembled).
    let inTheme = false;
    for (const { theme, byName } of themeCands) {
      const tc = byName.get(key);
      if (!tc) continue;
      inTheme = true;
      if (!ed) {
        inclusion = tc.inclusion;
        parts.push({ value: W_SYNERGY * 0.5 * Math.max(0, Math.min(tc.synergy, 0.6)) / 0.6 });
      }
      const lift = Math.max(0, tc.inclusion - (ed?.inclusion ?? 0));
      parts.push({
        value: W_THEME * theme.weight * (0.5 * tc.inclusion + lift),
        reason: `${theme.label} build: in ${pct(tc.inclusion)} of decks`,
      });
    }
    if (inTheme) sources++;

    // Deck fit: what the user's own cards are about.
    let fits = 0;
    for (const dt of profile.themes) {
      if (fits >= 2 || !t.themes.includes(dt.id)) continue;
      fits++;
      parts.push({ value: W_FIT * dt.strength, reason: `Fits your ${dt.name} cards` });
    }
    if (profile.tribe && t.types.includes(profile.tribe)) {
      parts.push({ value: W_FIT * 0.8, reason: `${profile.tribe}: your deck's tribe` });
    }

    // User objectives: the tags are what make these the user's suggestions.
    let tagged = 0;
    for (const o of profile.objectives) {
      if (tagged >= 2 || !o.patternId) continue;
      if (!t.themes.includes(o.patternId) && !t.roles.includes(o.patternId)) continue;
      tagged++;
      parts.push({ value: W_TAG * o.weight, reason: `Fits your "${o.label}" objective` });
    }

    // Role gaps, capped to the single biggest so staples can't run away.
    const gap = profile.gaps
      .filter((g) => t.roles.includes(g.id))
      .sort((a, b) => a.count / a.target - b.count / b.target)[0];
    if (gap) {
      parts.push({
        value: W_GAP * (1 - gap.count / gap.target),
        reason: `Fills ${gap.name.toLowerCase()} gap (${gap.count}/${gap.target})`,
      });
    }

    // The tag/text-driven Scryfall searches.
    if (hit) {
      sources++;
      parts.push({ value: W_SEARCH * (hit.score / searchTop) });
      for (const reason of hit.reasons) {
        if (constraintReasons.includes(reason)) continue;
        // Its "Ramp: deck has 6 (aim ~10)" says the same as the gap chip.
        if (gap && /\(aim ~\d+\)$/.test(reason)) continue;
        // Its "Objective: X" says the same as the objective chip.
        if (tagged && /objective/i.test(reason)) continue;
        parts.push({ value: 0.01, reason });
      }
    }

    if (target) {
      if (t.roles.some((r) => targetRoles.includes(r))) {
        parts.push({ value: W_SAME_ROLE, reason: "Same role" });
      }
      const keeps = traitsOf(target).themes.find(
        (id) => deckThemeIds.has(id) && t.themes.includes(id),
      );
      if (keeps) parts.push({ value: W_FIT, reason: "Keeps the deck's theme" });
    }

    parts.push({ value: W_AGREE * Math.max(0, sources - 1) });

    let score = parts.reduce((sum, p) => sum + p.value, 0);
    if (mode === "gems") score *= (1 - inclusion) ** GEMS_EXPONENT;

    const reasons = [
      ...new Set(
        parts
          .filter((p) => p.reason)
          .sort((a, b) => b.value - a.value)
          .map((p) => p.reason as string),
      ),
      ...(target ? constraintReasons : []),
    ];
    recs.push({ card, score, reasons, group: t.primary ?? "Other" });
  }

  return diversify(recs.sort((a, b) => b.score - a.score));
}
