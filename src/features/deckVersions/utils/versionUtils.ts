// Types
import type { Deck, DeckEntry, DeckVersion } from "@/types";

// Store
import { inferCategory } from "@/utils/utils";

export function applyVersionToDeck(deck: Deck, version: DeckVersion): Deck {
  let entries: DeckEntry[] = deck.entries.map((e) => ({ ...e }));

  const safeOverrides = version.objectiveOverrides ?? [];

  for (const swap of version.swaps) {
    // Remove the card being swapped out
    entries = entries
      .map((e) =>
        e.card.id === swap.removeCardId
          ? { ...e, quantity: e.quantity - 1 }
          : e,
      )
      .filter((e) => e.quantity > 0);

    // Add the replacement card if not already present
    const existingIndex = entries.findIndex(
      (e) => e.card.id === swap.addCard.id,
    );

    // Check if this swapped-in card has objective overrides
    const override = safeOverrides.find((o) => o.cardId === swap.addCard.id);
    const objectiveIds = override?.objectiveIds ?? [];

    if (existingIndex >= 0) {
      entries = entries.map((e, i) =>
        i === existingIndex
          ? { ...e, quantity: e.quantity + 1, objectiveIds }
          : e,
      );
    } else {
      entries = [
        ...entries,
        {
          card: swap.addCard,
          quantity: 1,
          category: inferCategory(swap.addCard),
          objectiveIds,
        },
      ];
    }
  }

  // Apply overrides to cards that were NOT swapped — they exist in main deck
  // but may have different objective assignments in this version
  entries = entries.map((e) => {
    const override = safeOverrides.find((o) => o.cardId === e.card.id);
    return override ? { ...e, objectiveIds: override.objectiveIds } : e;
  });

  return { ...deck, entries };
}

export function getVersionLabel(
  deck: Deck,
  versionId: string | "main",
): string {
  if (versionId === "main") return deck.name;
  return deck.versions.find((v) => v.id === versionId)?.name ?? "Unknown";
}
