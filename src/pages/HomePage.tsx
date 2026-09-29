// Modules
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Store
import { deckStore } from '@/store/deckStore';

// Types
import type { Deck } from '@/types';

// Components
import DeckCard from '@/features/deckList/components/DeckCard';
import EmptyState from '@/features/deckList/components/EmptyState';
import ConfirmDelete from '@/components/ConfirmDelete/ConfirmDelete';

export default function HomePage() {
  const navigate = useNavigate();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<Deck | null>(null);

  useEffect(() => {
    deckStore.getAll().then((data) => {
      setDecks(data);
      setLoading(false);
    });
  }, []);

  const handleDeleteConfirm = () => {
    if (!pendingDelete) return;
    setDecks((prev) => prev.filter((d) => d.id !== pendingDelete.id));
    deckStore.delete(pendingDelete.id);
    setPendingDelete(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-base-100 flex flex-col gap-4 items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p className="text-base-content/70 text-sm font-semibold">
          Loading decks...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100 text-base-content">
      <main className="max-w-5xl mx-auto px-6 py-10">
        {decks.length === 0 ? (
          <EmptyState onBuildDeck={() => navigate('/build')} />
        ) : (
          <>
            <h2 className="text-sm font-semibold text-base-content/60 uppercase tracking-widest mb-6">
              Your Decks
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {decks.map((deck) => (
                <DeckCard
                  key={deck.id}
                  deck={deck}
                  onOpen={() => navigate(`/deck/${deck.id}`)}
                  onEdit={() => navigate(`/build/${deck.id}`)}
                  onDelete={setPendingDelete}
                />
              ))}
            </div>
          </>
        )}
        <ConfirmDelete
          open={!!pendingDelete}
          onClose={() => setPendingDelete(null)}
          onConfirm={handleDeleteConfirm}
        />
      </main>
    </div>
  );
}
