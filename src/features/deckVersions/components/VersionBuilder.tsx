// Modules
import { useState } from 'react';

// Types
import type { Deck, ScryfallCard } from '@/types';

// Components
import CardSearchPanel from '@/features/deckBuilder/components/CardSearchPanel';

interface VersionBuilderProps {
  deck: Deck;
  onSave: (name: string, note: string) => void;
  onAddSwap: (removeCardId: string, addCard: ScryfallCard) => void;
  onRemoveSwap: (index: number) => void;
  pendingSwaps: { removeCardId: string; addCard: ScryfallCard }[];
  onCancel: () => void;
}

export default function VersionBuilder({
  deck,
  onSave,
  onAddSwap,
  onRemoveSwap,
  pendingSwaps,
  onCancel,
}: VersionBuilderProps) {
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [swapError, setSwapError] = useState<string | null>(null);

  const handleAddSwap = (addCard: ScryfallCard) => {
    if (!selectedCardId) {
      setSwapError('Select a card to remove first.');
      return;
    }
    // Prevent duplicate swaps for same removeCardId
    const alreadySwapped = pendingSwaps.some(
      (s) => s.removeCardId === selectedCardId,
    );
    if (alreadySwapped) {
      setSwapError('That card already has a pending swap.');
      return;
    }
    setSwapError(null);
    onAddSwap(selectedCardId, addCard);
    setSelectedCardId(null);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name, note);
    setName('');
    setNote('');
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-6">
      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-widest">
        New Version
      </h3>

      {/* Version name + note */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-slate-400">Version Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. More Ramp, Control Build..."
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#1971c2] transition-colors"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-slate-400">Note</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What are you trying to improve with this version?"
            rows={2}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#1971c2] transition-colors resize-none"
          />
        </div>
      </div>

      {/* Swap builder */}
      <div className="flex flex-col gap-4">
        <h4 className="text-xs text-slate-400 uppercase tracking-widest">
          Build Swaps
        </h4>

        {/* Step 1 — pick card to remove */}
        <div className="flex flex-col gap-2">
          <p className="text-xs text-slate-500">
            Step 1 — select a card to remove from your deck:
          </p>
          <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
            {deck.entries.map((entry) => {
              const alreadySwapped = pendingSwaps.some(
                (s) => s.removeCardId === entry.card.id,
              );
              const isSelected = selectedCardId === entry.card.id;
              return (
                <button
                  key={entry.card.id}
                  onClick={() => {
                    setSelectedCardId(isSelected ? null : entry.card.id);
                    setSwapError(null);
                  }}
                  disabled={alreadySwapped}
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors text-left disabled:opacity-40"
                  style={{
                    backgroundColor: isSelected ? '#1971c222' : '#1e293b',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: isSelected ? '#1971c2' : '#334155',
                    color: alreadySwapped ? '#64748b' : '#f1f5f9',
                  }}
                >
                  <span>{entry.card.name}</span>
                  <span className="text-slate-500 text-xs">
                    {entry.category}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2 — search for replacement */}
        {selectedCardId && (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-slate-500">
              Step 2 — search for the replacement card:
            </p>
            <CardSearchPanel
              label=""
              placeholder="Search for replacement..."
              onSelectCard={handleAddSwap}
            />
          </div>
        )}

        {swapError && <p className="text-xs text-red-400">{swapError}</p>}

        {/* Pending swaps list */}
        {pendingSwaps.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs text-slate-400 uppercase tracking-widest">
              Pending Swaps
            </p>
            {pendingSwaps.map((swap, i) => {
              const outCard = deck.entries.find(
                (e) => e.card.id === swap.removeCardId,
              )?.card;
              return (
                <div
                  key={i}
                  className="flex items-center justify-between bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-red-400">
                      − {outCard?.name ?? 'Unknown'}
                    </span>
                    <span className="text-slate-600">→</span>
                    <span className="text-green-400">
                      + {swap.addCard.name}
                    </span>
                  </div>
                  <button
                    onClick={() => onRemoveSwap(i)}
                    className="text-slate-500 hover:text-red-400 transition-colors ml-2"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={!name.trim()}
          className="bg-[#1971c2] hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          Save Version
        </button>
        <button
          onClick={onCancel}
          className="text-sm text-slate-400 hover:text-white px-4 py-2 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
