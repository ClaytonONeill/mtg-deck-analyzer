/**
 * Objective labels the card-suggestion engine understands (each one matches an
 * entry in OBJECTIVE_SYNONYMS in features/recommendations/utils/deckSignals.ts).
 * Offered as one-tap presets when creating an objective; freeform labels are
 * still allowed, they just don't influence suggestions.
 */
export interface RecognizedObjective {
  label: string;
  description: string;
}

export const RECOGNIZED_OBJECTIVE_GROUPS: {
  group: string;
  items: RecognizedObjective[];
}[] = [
  {
    group: "Core roles",
    items: [
      { label: "Ramp", description: "Extra mana: rocks, dorks, land fetch." },
      { label: "Card Draw", description: "Refills the hand; card advantage." },
      { label: "Removal", description: "Answers a single threat." },
      { label: "Board Wipes", description: "Resets the board when behind." },
    ],
  },
  {
    group: "Synergies",
    items: [
      { label: "Tokens", description: "Makes or rewards creature tokens." },
      { label: "+1/+1 Counters", description: "Places or rewards +1/+1 counters." },
      { label: "Sacrifice", description: "Sac outlets and death payoffs." },
      { label: "Graveyard", description: "Recursion and reanimation." },
      { label: "Lifegain", description: "Gains life or pays off lifegain." },
      { label: "Landfall", description: "Triggers on lands entering." },
      { label: "Spellslinger", description: "Instants and sorceries matter." },
      { label: "Artifacts", description: "Artifacts matter." },
      { label: "Enchantments", description: "Enchantments matter." },
      { label: "Voltron", description: "Equipment and Auras on one threat." },
      { label: "Blink", description: "Exile and return for ETB value." },
      { label: "Mill", description: "Mills a library." },
    ],
  },
];
