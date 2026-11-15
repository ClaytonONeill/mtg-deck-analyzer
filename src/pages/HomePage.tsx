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
import PageShell from '@/components/PageShell/PageShell';

// Icons
import { TriangleAlert, X } from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<Deck | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    deckStore.getAll().then((data) => {
      setDecks(data);
      setLoading(false);
    });
  }, []);

  // Optimistic: the tile disappears immediately, and comes back (in its old
  // position) with an error if Supabase rejects the delete.
  const handleDeleteConfirm = async () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    const snapshot = decks;
    setPendingDelete(null);
    setDeleteError(null);
    setDecks((prev) => prev.filter((d) => d.id !== target.id));
    try {
      await deckStore.delete(target.id);
    } catch (e) {
      console.error(`Failed to delete ${target.name}:`, e);
      setDecks(snapshot);
      setDeleteError(`Couldn't delete "${target.name}". It's still in your library — try again.`);
    }
  };

  if (loading) {
    return (
      <PageShell className="flex flex-col gap-4 items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p className="text-base-content/70 text-sm font-semibold">
          Loading decks...
        </p>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <main className="max-w-5xl mx-auto px-6 py-10">
        {deleteError && (
          <div role="alert" className="alert alert-error mb-6">
            <TriangleAlert size={18} />
            <span className="text-sm md:text-base">{deleteError}</span>
            <button
              type="button"
              onClick={() => setDeleteError(null)}
              className="btn btn-ghost btn-sm btn-circle"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        )}
        {decks.length === 0 ? (
          <EmptyState onBuildDeck={() => navigate('/build')} />
        ) : (
          <>
            <div className="flex items-baseline gap-3 mb-6">
              <h2 className="font-display text-2xl md:text-3xl font-bold tracking-wide">
                Your Decks
              </h2>
              <span className="text-sm md:text-base text-base-content/50">
                {decks.length} {decks.length === 1 ? 'deck' : 'decks'}
              </span>
            </div>
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
    </PageShell>
  );
}
