// Modules
import { useNavigate } from "react-router-dom";

// Hooks
import { useWishlist } from "@/hooks/useWishlist";

// Store
import { deckStore } from "@/store/deckStore";

// Components
import WishlistAddPanel from "@/features/wishlist/components/WishlistAddPanel";
import WishlistCard from "@/features/wishlist/components/WishlistCard";

export default function WishlistPage() {
  const navigate = useNavigate();
  const { entries, addCard, removeEntry, tagDeck, untagDeck, updateNote } =
    useWishlist();

  const allDecks = deckStore.getAll();
  const existingCardIds = entries.map((e) => e.card.id);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <button
          onClick={() => navigate("/")}
          className="text-slate-400 hover:text-white text-sm transition-colors hover:cursor-pointer"
        >
          ← Back
        </button>
        <h1 className="text-lg font-bold text-white">Wishlist</h1>
        <span className="text-sm text-slate-500">
          {entries.length} card{entries.length !== 1 ? "s" : ""}
        </span>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8 flex flex-col gap-8">
        {/* Add panel */}
        <WishlistAddPanel onAdd={addCard} existingCardIds={existingCardIds} />

        {/* Empty state */}
        {entries.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
            <div className="text-5xl">✨</div>
            <p className="text-slate-400 text-sm">Your wishlist is empty.</p>
            <p className="text-slate-600 text-xs max-w-xs">
              Search for cards above to add them. Tag them to decks so they
              appear in that deck's Wishlist tab.
            </p>
          </div>
        )}

        {/* Full list */}
        {entries.length > 0 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-xs text-slate-500 uppercase tracking-widest">
              All wishlisted cards
            </h2>

            {/* Deck filter tabs if decks exist */}
            {allDecks.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {entries.map((entry) => (
                  <WishlistCard
                    key={entry.id}
                    entry={entry}
                    onRemove={removeEntry}
                    onTagDeck={tagDeck}
                    onUntagDeck={untagDeck}
                    onUpdateNote={updateNote}
                  />
                ))}
              </div>
            )}

            {allDecks.length === 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {entries.map((entry) => (
                  <WishlistCard
                    key={entry.id}
                    entry={entry}
                    onRemove={removeEntry}
                    onTagDeck={tagDeck}
                    onUntagDeck={untagDeck}
                    onUpdateNote={updateNote}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
