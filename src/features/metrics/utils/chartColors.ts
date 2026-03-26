import type {
  TypeDataPoint,
  ColorGroup,
  CMCDataPoint,
} from '../types/metrics.types';

export const MTG_COLORS: Record<string, string> = {
  W: '#f9f1dc',
  U: '#1971c2',
  B: '#722795ff',
  R: '#c92a2a',
  G: '#2f9e44',
  colorless: '#868e96',
};

export const MULTICOLOR_GOLD = '#f59f00';

// Returns a unique gradient ID for a given set of colors
export function gradientId(colors: string[]): string {
  return `grad-${colors.slice().sort().join('-')}`;
}

// Builds stop definitions for a multi-color gradient
export function buildGradientStops(
  colors: string[],
): { offset: string; color: string }[] {
  if (colors.length === 1) {
    return [
      { offset: '0%', color: MTG_COLORS[colors[0]] ?? MULTICOLOR_GOLD },
      { offset: '100%', color: MTG_COLORS[colors[0]] ?? MULTICOLOR_GOLD },
    ];
  }
  return colors.map((c, i) => ({
    offset: `${Math.round((i / (colors.length - 1)) * 100)}%`,
    color: MTG_COLORS[c] ?? MULTICOLOR_GOLD,
  }));
}

export function barFill(colorKey: string, colors: string[]): string {
  if (colorKey === 'colorless') return MTG_COLORS.colorless;
  if (colorKey === 'multicolor') return `url(#${gradientId(colors)})`;
  return MTG_COLORS[colorKey] ?? MULTICOLOR_GOLD;
}

// Finds the ColorGroup for a given flat key
function groupForKey(
  groups: ColorGroup[],
  key: string,
): ColorGroup | undefined {
  return groups.find((g) => {
    const gKey =
      g.colorKey === 'multicolor'
        ? g.colors.slice().sort().join('')
        : g.colorKey;
    return gKey === key;
  });
}

export function getFillForKey(
  data: TypeDataPoint[] | CMCDataPoint[],
  key: string,
): string {
  for (const point of data) {
    const group = groupForKey(point.groups, key);
    if (group) {
      return barFill(group.colorKey, group.colors);
    }
  }
  return 'transparent';
}
