// Modules
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Store
import { deckStore } from "@/store/deckStore";

// Types
import type { Deck } from "@/types";

// Components
import DeckCard from "@/features/deckList/components/DeckCard";
import EmptyState from "@/features/deckList/components/EmptyState";

export default function HomePage() {
  const navigate = useNavigate();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    deckStore.getAll().then((data) => {
      setDecks(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-400 text-sm">Loading decks...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
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
