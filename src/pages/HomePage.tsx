// Modules
import { useNavigate } from "react-router-dom";

// Store
import { deckStore } from "@/store/deckStore";

// Components
import DeckCard from "@/features/deckList/components/DeckCard";
import EmptyState from "@/features/deckList/components/EmptyState";

export default function HomePage() {
  const navigate = useNavigate();
  const decks = deckStore.getAll();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight text-white">
          MTG Deck Analyzer
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/wishlist")}
            className="text-sm font-semibold text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-4 py-2 rounded-lg transition-colors hover:cursor-pointer"
          >
            ✨ Wishlist
          </button>
          <button
            onClick={() => navigate("/build")}
            className="bg-[#1971c2] hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors hover:cursor-pointer"
          >
            + New Deck
          </button>
        </div>
      </header>

      {/* Body */}
      <main className="max-w-5xl mx-auto px-6 py-10">
        {decks.length === 0 ? (
          <EmptyState onBuildDeck={() => navigate("/build")} />
        ) : (
          <>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-6">
              Your Decks
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {decks.map((deck) => (
                <DeckCard
                  key={deck.id}
                  deck={deck}
                  onOpen={() => navigate(`/deck/${deck.id}`)}
                  onEdit={() => navigate(`/build/${deck.id}`)}
                  onDelete={() => {
                    deckStore.delete(deck.id);
                    window.location.reload();
                  }}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
