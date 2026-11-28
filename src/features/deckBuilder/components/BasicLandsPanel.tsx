// Store
import { addCardToDeck, removeCardFromDeck } from "@/store/deckStore";

// Utils
import { BASIC_LANDS } from "@/features/deckBuilder/utils/basicLands";
import { getRules } from "@/features/formats/formats";

// Types
import type { Deck } from "@/types";

interface BasicLandsPanelProps {
  deck: Deck;
  onDeckChange: (deck: Deck) => void;
  disabled?: boolean;
}

/** +/- counters for the five basics, added to the main deck. Basics are
 * legal in every format and exempt from copy limits, so the only limit is
 * the deck size (`disabled`). */
export default function BasicLandsPanel({
  deck,
  onDeckChange,
  disabled,
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

  // Commander: only lands in the commander's color identity. Other formats
  // have no color identity rule, so offer all five.
  const availableLands =
    getRules(deck).enforcesColorIdentity && deck.commander
      ? BASIC_LANDS.filter(
          (l) =>
            l.color_identity.length === 0 ||
            l.color_identity.some((c) => deck.colorIdentity.includes(c)),
        )
      : BASIC_LANDS;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="text-xs md:text-sm font-black uppercase tracking-widest opacity-60">
          Basic Lands
        </h3>
        <div className="h-px flex-1 bg-base-content/10"></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {availableLands.map((land) => {
          const count = getLandCount(land.id);
          return (
            <div
              key={land.id}
              className="card bg-base-100 border border-base-300 shadow-sm transition-all hover:border-primary/50"
            >
              <div className="p-3 flex items-center justify-between">
                <span className="text-xs md:text-sm font-black uppercase tracking-tight opacity-80">
                  {land.name}
                </span>

                <div className="join bg-base-200 border border-base-300">
                  <button
                    onClick={() => decrement(land.id)}
                    disabled={count === 0}
                    aria-label={`Remove a ${land.name}`}
                    className="join-item btn btn-xs md:btn-sm text-xs md:text-sm btn-ghost hover:btn-error no-animation px-3"
                  >
                    −
                  </button>
                  <div className="join-item flex items-center justify-center bg-base-100 px-3 min-w-[2.5rem]">
                    <span className="text-xs md:text-sm font-mono font-bold">{count}</span>
                  </div>
                  <button
                    onClick={() => increment(land.id)}
                    aria-label={`Add a ${land.name}`}
                    className="join-item btn btn-xs md:btn-sm text-xs md:text-sm btn-ghost hover:btn-primary no-animation px-3"
                    disabled={disabled}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
