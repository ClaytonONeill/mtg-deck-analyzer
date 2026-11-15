/** Objective filter id meaning "cards with no objective assigned". */
export const UNTAGGED = "__untagged__";

/** Mana value buckets for the range picker; the last one is open-ended. */
export const MV_BUCKETS = [0, 1, 2, 3, 4, 5, 6, 7] as const;
export const MV_TOP = 7;

export type ColorMode = "any" | "all";

/**
 * Does a card's color identity pass the color filter?
 * - any: shares at least one selected color ("C" = colorless matches);
 * - all: has every selected color ("C" = must be colorless).
 */
export function matchesColors(
  identity: string[],
  selected: string[],
  mode: ColorMode,
): boolean {
  if (selected.length === 0) return true;
  const wantsColorless = selected.includes("C");
  const colors = selected.filter((c) => c !== "C");
  if (mode === "any") {
    return (
      identity.some((c) => colors.includes(c)) ||
      (wantsColorless && identity.length === 0)
    );
  }
  if (wantsColorless && identity.length > 0) return false;
  return colors.every((c) => identity.includes(c));
}
