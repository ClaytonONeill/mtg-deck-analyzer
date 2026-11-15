/** Objective filter id meaning "cards with no objective assigned". */
export const UNTAGGED = "__untagged__";

/** Mana value buckets for the range picker; the last one is open-ended. */
export const MV_BUCKETS = [0, 1, 2, 3, 4, 5, 6, 7] as const;
export const MV_TOP = 7;

/**
 * Does a card's color identity pass the color filter? It passes when it
 * shares any selected color; "C" matches colorless cards. Nothing selected
 * means every card passes.
 */
export function matchesColors(identity: string[], selected: string[]): boolean {
  if (selected.length === 0) return true;
  return (
    identity.some((c) => selected.includes(c)) ||
    (selected.includes("C") && identity.length === 0)
  );
}
