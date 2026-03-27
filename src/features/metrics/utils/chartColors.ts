// Types
import type {
  TypeDataPoint,
  ColorGroup,
  CMCDataPoint,
} from "../types/metrics.types";

export const MTG_COLORS: Record<string, string> = {
  W: "#f0d58c",
  U: "#1971c2",
  B: "#6c3d9e",
  R: "#c92a2a",
  G: "#2f9e44",
  colorless: "#6b6b69",
};

export const MULTICOLOR_GOLD = "#f59f00";

// Returns a unique gradient ID for a given set of colors
export function gradientId(colors: string[]): string {
  return `grad-${colors.slice().sort().join("-")}`;
}

// Builds stop definitions for a multi-color gradient
export function buildGradientStops(
  colors: string[],
): { offset: string; color: string }[] {
  if (colors.length === 1) {
    return [
      { offset: "0%", color: MTG_COLORS[colors[0]] ?? MULTICOLOR_GOLD },
      { offset: "100%", color: MTG_COLORS[colors[0]] ?? MULTICOLOR_GOLD },
    ];
  }
  return colors.map((c, i) => ({
    offset: `${Math.round((i / (colors.length - 1)) * 100)}%`,
    color: MTG_COLORS[c] ?? MULTICOLOR_GOLD,
  }));
}

export function barFill(colorKey: string, colors: string[]): string {
  if (colorKey === "colorless") return MTG_COLORS.colorless;
  if (colorKey === "multicolor") return `url(#${gradientId(colors)})`;
  return MTG_COLORS[colorKey] ?? MULTICOLOR_GOLD;
}

// Finds the ColorGroup for a given flat key
function groupForKey(
  groups: ColorGroup[],
  key: string,
): ColorGroup | undefined {
  return groups.find((g) => {
    const gKey =
      g.colorKey === "multicolor"
        ? g.colors.slice().sort().join("")
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
  return "transparent";
}

// Collect all unique multicolor combinations across all data points
export function collectMulticolorGroups(
  dataPoints: { groups: ColorGroup[] }[],
): ColorGroup[] {
  const seen = new Set<string>();
  const result: ColorGroup[] = [];
  for (const point of dataPoints) {
    for (const group of point.groups) {
      if (group.colorKey !== "multicolor") continue;
      const key = group.colors.slice().sort().join("");
      if (!seen.has(key)) {
        seen.add(key);
        result.push(group);
      }
    }
  }
  return result;
}
