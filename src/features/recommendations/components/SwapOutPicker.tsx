// Modules
import { useState } from "react";

// Types
import type { DeckEntry, ScryfallCard } from "@/types";

// Utils
import { BASIC_LANDS } from "@/features/deckBuilder/utils/basicLands";
import { cardRoles, primaryType } from "../utils/deckSignals";

// Components
import ManaCost from "@/components/ManaSymbol/ManaCost";

// Icons
import { X } from "lucide-react";

interface SwapOutPickerProps {
  incoming: ScryfallCard;
  entries: DeckEntry[];
  /** Cards already swapped out by a pending swap; can't be picked again. */
  swappedOutIds: Set<string>;
  onPick: (entry: DeckEntry) => void;
  onClose: () => void;
}

// "Swap in" from the Suggestions tab: choose which card the suggestion
// replaces. Cards sharing the incoming card's type or role are listed first.
export default function SwapOutPicker({
  incoming,
  entries,
  swappedOutIds,
  onPick,
  onClose,
}: SwapOutPickerProps) {
  const [query, setQuery] = useState("");

  const basicTypeLines = BASIC_LANDS.map((b) => b.type_line);
  const incomingType = primaryType(incoming);
  const incomingRoles = cardRoles(incoming);
  const isSimilar = (card: ScryfallCard) =>
    primaryType(card) === incomingType ||
    cardRoles(card).some((r) => incomingRoles.includes(r));

  const candidates = entries
    .filter(
      (e) =>
        !basicTypeLines.includes(e.card.type_line ?? "") &&
        !swappedOutIds.has(e.card.id) &&
        e.card.name.toLowerCase().includes(query.trim().toLowerCase()),
    )
    .sort((a, b) => a.card.name.localeCompare(b.card.name));
  const similar = candidates.filter((e) => isSimilar(e.card));
  const rest = candidates.filter((e) => !isSimilar(e.card));

  const renderRow = (entry: DeckEntry) => (
    <li key={entry.card.id}>
      <button
        type="button"
        onClick={() => onPick(entry)}
        className="w-full flex items-center justify-between gap-3 px-3 py-3 rounded-lg hover:bg-base-200 text-left"
      >
        <span className="min-w-0">
          <span className="block text-sm font-semibold truncate">
            {entry.card.name}
          </span>
          <span className="block text-xs text-base-content/60 truncate">
            {entry.card.type_line}
          </span>
        </span>
        <span className="shrink-0">
          <ManaCost
            cost={entry.card.mana_cost || entry.card.card_faces?.[0]?.mana_cost || ""}
            size={12}
          />
        </span>
      </button>
    </li>
  );

  return (
    <div className="modal modal-open modal-bottom sm:modal-middle" onClick={onClose}>
      <div
        className="modal-box flex flex-col gap-3 max-h-[85vh] p-4 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-lg font-bold">Swap in {incoming.name}</h3>
            <p className="text-sm text-base-content/60">
              Pick the card it replaces.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="btn btn-ghost btn-sm btn-circle shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter your deck..."
          className="input input-bordered w-full"
        />

        <div className="overflow-y-auto -mx-2 px-2">
          {similar.length > 0 && (
            <>
              <h4 className="text-xs uppercase font-black tracking-widest opacity-50 mt-1 mb-1">
                Suggested to replace
              </h4>
              <ul>{similar.map(renderRow)}</ul>
            </>
          )}
          {rest.length > 0 && (
            <>
              <h4 className="text-xs uppercase font-black tracking-widest opacity-50 mt-3 mb-1">
                Rest of the deck
              </h4>
              <ul>{rest.map(renderRow)}</ul>
            </>
          )}
          {candidates.length === 0 && (
            <p className="text-sm text-base-content/60 text-center py-8">
              No matching cards.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
