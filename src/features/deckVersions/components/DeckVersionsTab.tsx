// Modules
import { useState } from 'react';

// Types
import type { Deck, ScryfallCard } from '@/types';

// Hooks
import { useDeckVersions } from '@/features/deckVersions/hooks/useDeckVersions';

// Components
import VersionCard from '@/features/deckVersions/components/VersionCard';
import VersionBuilder from '@/features/deckVersions/components/VersionBuilder';
import VersionCompare from '@/features/deckVersions/components/VersionCompare';

interface DeckVersionsTabProps {
  deck: Deck;
  onDeckChange: (deck: Deck) => void;
}

interface PendingSwap {
  removeCardId: string;
  addCard: ScryfallCard;
}

type VersionsView = 'list' | 'compare';

export default function DeckVersionsTab({
  deck,
  onDeckChange,
}: DeckVersionsTabProps) {
  const [view, setView] = useState<VersionsView>('list');
  const [showBuilder, setShowBuilder] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editNote, setEditNote] = useState('');
  const [pendingSwaps, setPendingSwaps] = useState<PendingSwap[]>([]);

  const { versions, createVersion, deleteVersion, addSwap, updateVersion } =
    useDeckVersions(deck, onDeckChange);

  const handleSaveVersion = (name: string, note: string) => {
    createVersion(name, note);
    // Apply pending swaps to the newly created version
    setTimeout(() => {
      const latest = deck.versions?.[deck.versions.length - 1];
      if (!latest) return;
      pendingSwaps.forEach((swap) => {
        addSwap(latest.id, swap.removeCardId, swap.addCard);
      });
      setPendingSwaps([]);
      setShowBuilder(false);
    }, 0);
  };

  const handleAddPendingSwap = (
    removeCardId: string,
    addCard: ScryfallCard,
  ) => {
    setPendingSwaps((prev) => [...prev, { removeCardId, addCard }]);
  };

  const handleRemovePendingSwap = (index: number) => {
    setPendingSwaps((prev) => prev.filter((_, i) => i !== index));
  };

  const handleToggleSelect = (id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
  };

  const startEdit = (id: string, name: string, note: string) => {
    setEditingId(id);
    setEditName(name);
    setEditNote(note);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Sub-nav */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-slate-800 p-1 rounded-lg">
          {(['list', 'compare'] as VersionsView[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="px-4 py-1.5 rounded-md text-sm font-semibold transition-colors hover:cursor-pointer"
              style={{
                backgroundColor: view === v ? '#1971c2' : 'transparent',
                color: view === v ? '#fff' : '#64748b',
              }}
            >
              {v === 'list' ? 'Versions' : 'Compare'}
            </button>
          ))}
        </div>

        {view === 'list' && !showBuilder && (
          <button
            onClick={() => {
              setShowBuilder(true);
              setPendingSwaps([]);
            }}
            className="text-sm font-semibold bg-[#1971c2] hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors"
          >
            + New Version
          </button>
        )}
      </div>

      {/* List view */}
      {view === 'list' && (
        <div className="flex flex-col gap-4">
          {showBuilder && (
            <VersionBuilder
              deck={deck}
              pendingSwaps={pendingSwaps}
              onSave={handleSaveVersion}
              onAddSwap={handleAddPendingSwap}
              onRemoveSwap={handleRemovePendingSwap}
              onCancel={() => {
                setShowBuilder(false);
                setPendingSwaps([]);
              }}
            />
          )}

          {versions.length === 0 && !showBuilder && (
            <p className="text-slate-500 text-sm text-center py-12">
              No versions yet — create one to start experimenting with swaps.
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {versions.map((version) => (
              <div key={version.id}>
                {editingId === version.id ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1971c2] transition-colors"
                    />
                    <textarea
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                      rows={2}
                      className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1971c2] transition-colors resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          updateVersion(version.id, editName, editNote);
                          setEditingId(null);
                        }}
                        className="text-sm font-semibold bg-[#1971c2] hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-sm text-slate-400 hover:text-white px-3 py-1.5 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <VersionCard
                    version={version}
                    deck={deck}
                    isSelected={selectedId === version.id}
                    onSelect={() => handleToggleSelect(version.id)}
                    onDelete={() => deleteVersion(version.id)}
                    onEdit={() =>
                      startEdit(version.id, version.name, version.note)
                    }
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compare view */}
      {view === 'compare' &&
        (versions.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-12">
            No versions yet — create at least one version to compare.
          </p>
        ) : (
          <VersionCompare deck={deck} />
        ))}
    </div>
  );
}
