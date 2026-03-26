import type { Deck, CardCategory } from '@/types';
import type {
  ColorGroup,
  ColorKey,
  TypeDataPoint,
  CMCDataPoint,
} from '../types/metrics.types';

function getColorKey(colorIdentity: string[]): ColorKey {
  if (colorIdentity.length === 0) return 'colorless';
  if (colorIdentity.length === 1) return colorIdentity[0] as ColorKey;
  return 'multicolor';
}

function mergeGroups(groups: ColorGroup[]): ColorGroup[] {
  const map = new Map<string, ColorGroup>();
  for (const g of groups) {
    const key =
      g.colorKey === 'multicolor'
        ? g.colors.slice().sort().join('')
        : g.colorKey;
    if (map.has(key)) {
      map.get(key)!.count += g.count;
    } else {
      map.set(key, { ...g });
    }
  }
  return Array.from(map.values());
}

export function getTypeBreakdown(
  deck: Deck,
  includeLands: boolean,
): TypeDataPoint[] {
  const map = new Map<CardCategory, ColorGroup[]>();

  for (const entry of deck.entries) {
    if (!includeLands && entry.category === 'Land') continue;
    const colorKey = getColorKey(entry.card.color_identity);
    const group: ColorGroup = {
      colorKey,
      colors: entry.card.color_identity,
      count: entry.quantity,
    };
    const existing = map.get(entry.category) ?? [];
    map.set(entry.category, [...existing, group]);
  }

  return Array.from(map.entries())
    .map(([category, groups]) => ({
      category,
      groups: mergeGroups(groups),
    }))
    .sort((a, b) => {
      const total = (d: TypeDataPoint) =>
        d.groups.reduce((s, g) => s + g.count, 0);
      return total(b) - total(a);
    });
}

export function getCMCBreakdown(
  deck: Deck,
  includeLands: boolean,
): CMCDataPoint[] {
  const map = new Map<number, ColorGroup[]>();

  for (const entry of deck.entries) {
    if (!includeLands && entry.category === 'Land') continue;
    const cmc = entry.card.cmc ?? 0;
    const colorKey = getColorKey(entry.card.color_identity);
    const group: ColorGroup = {
      colorKey,
      colors: entry.card.color_identity,
      count: entry.quantity,
    };
    const existing = map.get(cmc) ?? [];
    map.set(cmc, [...existing, group]);
  }

  if (map.size === 0) return [];

  const max = Math.max(...map.keys());
  return Array.from({ length: max + 1 }, (_, i) => ({
    cmc: i,
    groups: mergeGroups(map.get(i) ?? []),
  }));
}
