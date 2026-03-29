const PALETTE = [
  '#e03131',
  '#2f9e44',
  '#1971c2',
  '#f59f00',
  '#7048e8',
  '#0ca678',
  '#e64980',
  '#fd7e14',
  '#4263eb',
  '#74b816',
];

export function assignObjectiveColor(existingColors: string[]): string {
  const available = PALETTE.filter((c) => !existingColors.includes(c));
  if (available.length > 0) return available[0];
  // If all colors are used, cycle back through
  return PALETTE[existingColors.length % PALETTE.length];
}
