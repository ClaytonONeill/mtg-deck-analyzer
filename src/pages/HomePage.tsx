// Modules
import { useState, useEffect, useMemo } from 'react';
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
import ManaSymbol from '@/components/ManaSymbol/ManaSymbol';

// Hooks
import { useLocalStorage } from '@/hooks/useLocalStorage';

// Utils
import {
  DECK_SORTS,
  FILTER_COLORS,
  filterDecks,
  sortDecks,
  type DeckSort,
  type FilterColor,
  type FormatFilter,
} from '@/features/deckList/utils/deckLibrary';
import { FORMATS, FORMAT_ORDER } from '@/features/formats/formats';

// Icons
import { Search, TriangleAlert, X } from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState<Deck | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [colors, setColors] = useState<FilterColor[]>([]);
  const [sort, setSort] = useLocalStorage<DeckSort>('home-deck-sort', 'edited');
  const [formatFilter, setFormatFilter] = useLocalStorage<FormatFilter>(
    'home-deck-format',
    'all',
  );

  const visibleDecks = useMemo(
    () => sortDecks(filterDecks(decks, query, colors, formatFilter), sort),
    [decks, query, colors, formatFilter, sort],
  );
  const filtering =
    query.trim() !== '' || colors.length > 0 || formatFilter !== 'all';
  const clearFilters = () => {
    setQuery('');
    setColors([]);
    setFormatFilter('all');
  };
  const toggleColor = (c: FilterColor) =>
    setColors((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );

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
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-10">
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
            <div className="flex items-baseline gap-3 mb-4">
              <h2 className="font-display text-2xl md:text-3xl font-bold tracking-wide">
                Your Decks
              </h2>
              <span className="text-sm md:text-base text-base-content/50">
                {filtering
                  ? `${visibleDecks.length} of ${decks.length}`
                  : `${decks.length} ${decks.length === 1 ? 'deck' : 'decks'}`}
              </span>
            </div>

            {/* Library toolbar */}
            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-6">
              <label className="input input-sm md:input-md flex items-center gap-2 w-full md:max-w-xs bg-base-100">
                <Search size={16} className="opacity-50 shrink-0" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search decks or commanders"
                  className="grow min-w-0"
                  aria-label="Search decks"
                />
              </label>

              <div className="flex flex-wrap items-center justify-between md:justify-start gap-3 md:contents">
                <div className="flex items-center gap-1.5 md:gap-2.5" role="group" aria-label="Filter by color">
                  {FILTER_COLORS.map((c) => {
                    const on = colors.includes(c);
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => toggleColor(c)}
                        aria-pressed={on}
                        aria-label={`${c === 'C' ? 'Colorless' : c} decks`}
                        className={`rounded-full p-0.5 md:p-1 transition-all ${on ? 'bg-primary/25 ring-2 ring-primary md:scale-110' : 'opacity-40 hover:opacity-90 grayscale-[60%] hover:grayscale-0'}`}
                      >
                        <ManaSymbol symbol={c} size={20} />
                      </button>
                    );
                  })}
                </div>

                <select
                  value={formatFilter}
                  onChange={(e) => setFormatFilter(e.target.value as FormatFilter)}
                  className="select select-sm md:select-md w-auto md:ml-auto bg-base-100 text-sm"
                  aria-label="Filter by format"
                >
                  <option value="all">All formats</option>
                  {FORMAT_ORDER.map((f) => (
                    <option key={f} value={f}>
                      {FORMATS[f].label}
                    </option>
                  ))}
                </select>

                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as DeckSort)}
                  className="select select-sm md:select-md w-auto bg-base-100 text-sm"
                  aria-label="Sort decks"
                >
                  {DECK_SORTS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {visibleDecks.length === 0 && (
              <div className="text-center py-16 space-y-3">
                <p className="text-base md:text-lg text-base-content/60">
                  No decks match those filters.
                </p>
                <button type="button" onClick={clearFilters} className="btn btn-sm btn-ghost text-sm">
                  Clear filters
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleDecks.map((deck) => (
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
