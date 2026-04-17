// Types
import type { Deck, Objective, WishlistEntry } from "@/types";

// Components
import WishlistCard from "@/features/wishlist/components/WishlistCard";

interface WishlistDeckFilterProps {
  deckId: string;
  entries: WishlistEntry[];
  allDecks: Deck[];
  allObjectives: Objective[];
  onRemove: (id: string) => void;
  onTagDeck: (entryId: string, deckId: string) => void;
  onUntagDeck: (entryId: string, deckId: string) => void;
  onAssignObjective: (entryId: string, objective: Objective) => void;
  onUnassignObjective: (entryId: string, objectiveId: string) => void;
}

export default function WishlistDeckFilter({
  deckId,
  entries,
  allDecks,
  allObjectives,
  onRemove,
  onTagDeck,
  onUntagDeck,
  onAssignObjective,
  onUnassignObjective,
}: WishlistDeckFilterProps) {
  const deckEntries = entries.filter((e) => e.deckIds.includes(deckId));

  if (deckEntries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
        <div className="bg-base-200 p-6 rounded-full opacity-50">
          <svg
            className="w-12 h-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        </div>
        <div className="space-y-1">
          <p className="font-bold opacity-60">No wishlist cards tagged here.</p>
          <p className="text-sm opacity-40 max-w-xs">
            Head to the global Wishlist to add cards and tag them to this
            specific deck.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <span className="h-px flex-1 bg-base-300"></span>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">
          {deckEntries.length} card{deckEntries.length !== 1 ? "s" : ""} on
          wishlist
        </p>
        <span className="h-px flex-1 bg-base-300"></span>
      </div>

      <div className="grid grid-cols-1 gap-6 w-full max-w-2xl mx-auto">
        {deckEntries.map((entry) => (
          <WishlistCard
            key={entry.id}
            entry={entry}
            allDecks={allDecks}
            allObjectives={allObjectives}
            onRemove={onRemove}
            onTagDeck={onTagDeck}
            onUntagDeck={onUntagDeck}
            onAssignObjective={onAssignObjective}
            onUnassignObjective={onUnassignObjective}
          />
        ))}
      </div>
    </div>
  );
}
