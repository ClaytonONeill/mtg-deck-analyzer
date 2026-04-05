// Types
import type { Deck, WishlistEntry } from '@/types';

// Components
import WishlistCard from '@/features/wishlist/components/WishlistCard';

interface WishlistDeckFilterProps {
  deckId: string;
  entries: WishlistEntry[];
  allDecks: Deck[];
  onRemove: (id: string) => void;
  onTagDeck: (entryId: string, deckId: string) => void;
  onUntagDeck: (entryId: string, deckId: string) => void;
  onUpdateNote: (entryId: string, note: string) => void;
}

export default function WishlistDeckFilter({
  deckId,
  entries,
  allDecks,
  onRemove,
  onTagDeck,
  onUntagDeck,
  onUpdateNote,
}: WishlistDeckFilterProps) {
  const deckEntries = entries.filter((e) => e.deckIds.includes(deckId));

  if (deckEntries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
        <p className="text-slate-500 text-sm">
          No wishlist cards tagged to this deck yet.
        </p>
        <p className="text-slate-600 text-xs max-w-xs">
          Go to the global Wishlist from the home page to add cards and tag them
          to this deck.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-slate-500 uppercase tracking-widest">
        {deckEntries.length} card{deckEntries.length !== 1 ? 's' : ''}{' '}
        wishlisted for this deck
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {deckEntries.map((entry) => (
          <WishlistCard
            key={entry.id}
            entry={entry}
            allDecks={allDecks}
            onRemove={onRemove}
            onTagDeck={onTagDeck}
            onUntagDeck={onUntagDeck}
            onUpdateNote={onUpdateNote}
          />
        ))}
      </div>
    </div>
  );
}
