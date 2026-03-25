import type { Deck } from "@/types";
import { BASIC_LANDS } from "@/features/deckBuilder/utils/basicLands";
import { addCardToDeck, removeCardFromDeck } from "@/store/deckStore";

interface BasicLandsPanelProps {
  deck: Deck;
  onDeckChange: (deck: Deck) => void;
}

export default function BasicLandsPanel({
  deck,
  onDeckChange,
}: BasicLandsPanelProps) {
  const getLandCount = (landId: string) =>
    deck.entries.find((e) => e.card.id === landId)?.quantity ?? 0;

  const increment = (landId: string) => {
    const land = BASIC_LANDS.find((l) => l.id === landId)!;
    onDeckChange(addCardToDeck(deck, land));
  };

  const decrement = (landId: string) => {
    const count = getLandCount(landId);
    if (count === 0) return;
    onDeckChange(removeCardFromDeck(deck, landId));
  };

  // Only show lands in the commander's color identity (+ colorless always)
  const availableLands = deck.commander
    ? BASIC_LANDS.filter(
        (l) =>
          l.color_identity.length === 0 ||
          l.color_identity.some((c) => deck.colorIdentity.includes(c)),
      )
    : BASIC_LANDS;

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-slate-300">Basic Lands</h3>
      <div className="flex flex-wrap gap-3">
        {availableLands.map((land) => {
          const count = getLandCount(land.id);
          return (
            <div
              key={land.id}
              className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 flex items-center gap-3"
            >
              <span className="text-sm text-white font-medium w-16">
                {land.name}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => decrement(land.id)}
                  disabled={count === 0}
                  className="w-7 h-7 rounded-md bg-slate-700 hover:bg-slate-600 disabled:opacity-30 text-white font-bold transition-colors"
                >
                  −
                </button>
                <span className="text-white text-sm w-5 text-center">
                  {count}
                </span>
                <button
                  onClick={() => increment(land.id)}
                  className="w-7 h-7 rounded-md bg-slate-700 hover:bg-slate-600 text-white font-bold transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
