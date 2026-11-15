// Fixed WUBRG hues for decorative accents (deck tile strips, banners). These
// are deliberately *not* theme tokens: a mono-red deck should read red in
// every theme, the same way the mana symbols themselves do.
const MANA_HEX: Record<string, string> = {
  W: "#f3e7b8",
  U: "#3b82c4",
  B: "#7a6a86",
  R: "#d9472f",
  G: "#2f9a55",
  C: "#b8b1a8",
};

/**
 * A left→right `linear-gradient` through a deck's color identity, in WUBRG
 * order as given. Colorless decks get a neutral stone strip.
 */
export function manaGradient(colors: string[]): string {
  const stops = (colors.length ? colors : ["C"]).map(
    (c) => MANA_HEX[c] ?? MANA_HEX.C,
  );
  if (stops.length === 1) stops.push(stops[0]);
  return `linear-gradient(90deg, ${stops.join(", ")})`;
}
