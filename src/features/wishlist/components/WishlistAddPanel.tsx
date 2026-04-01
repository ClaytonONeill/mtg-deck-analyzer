// Modules
import { useState } from 'react';

// Types
import type { Deck, ScryfallCard, WishlistEntry } from '@/types';

// Components
import CardSearchPanel from '@/features/deckBuilder/components/CardSearchPanel';

interface WishlistAddPanelProps {
  onAdd: (card: ScryfallCard, note: string) => WishlistEntry;
  onTagDeck: (entryId: string, deckId: string) => void;
  existingCardIds: string[];
  allDecks: Deck[];
}

export default function WishlistAddPanel({
  onAdd,
  onTagDeck,
  existingCardIds,
  allDecks,
}: WishlistAddPanelProps) {
  const [pending, setPending] = useState<ScryfallCard | null>(null);
  const [note, setNote] = useState('');
  const [selectedDeckIds, setSelectedDeckIds] = useState<string[]>([]);

  const handleSelect = (card: ScryfallCard) => {
    if (existingCardIds.includes(card.id)) return;
    setPending(card);
    setSelectedDeckIds([]);
  };

  const toggleDeck = (deckId: string) => {
    setSelectedDeckIds((prev) =>
      prev.includes(deckId)
        ? prev.filter((id) => id !== deckId)
        : [...prev, deckId],
    );
  };

  const handleAdd = () => {
    if (!pending) return;
    const entry = onAdd(pending, note);
    // Tag all selected decks atomically after add
    selectedDeckIds.forEach((deckId) => onTagDeck(entry.id, deckId));
    setPending(null);
    setNote('');
    setSelectedDeckIds([]);
  };

  return (
    <div className="flex flex-col gap-4">
      <CardSearchPanel
        label="Search for a card to wishlist"
        placeholder="Search cards..."
        onSelectCard={handleSelect}
      />

      {pending && (
        <div className="bg-slate-900 border border-[#1971c2] rounded-xl p-4 flex flex-col gap-4">
          {/* Card preview */}
          <div className="flex items-center gap-3">
            {pending.image_uris?.small && (
              <img
                src={pending.image_uris.small}
                alt={pending.name}
                className="w-12 rounded-lg shrink-0"
              />
            )}
            <div className="flex flex-col gap-0.5 min-w-0">
              <p className="text-white font-semibold text-sm truncate">
                {pending.name}
              </p>
              <p className="text-slate-400 text-xs">{pending.type_line}</p>
            </div>
          </div>

          {/* Note */}
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Why are you considering this card? (optional)"
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#1971c2] transition-colors"
          />

          {/* Deck tag selection */}
          {allDecks.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs text-slate-400 uppercase tracking-widest">
                Tag to decks (optional)
              </p>
              <div className="flex flex-wrap gap-2">
                {allDecks.map((deck) => {
                  const selected = selectedDeckIds.includes(deck.id);
                  return (
                    <button
                      key={deck.id}
                      onClick={() => toggleDeck(deck.id)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-full border transition-all"
                      style={{
                        backgroundColor: selected ? '#1971c222' : 'transparent',
                        borderColor: selected ? '#1971c2' : '#334155',
                        color: selected ? '#1971c2' : '#94a3b8',
                      }}
                    >
                      {deck.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="flex-1 bg-[#1971c2] hover:bg-blue-500 text-white font-semibold text-sm py-2 rounded-lg transition-colors"
            >
              Add to Wishlist
            </button>
            <button
              onClick={() => {
                setPending(null);
                setNote('');
                setSelectedDeckIds([]);
              }}
              className="text-sm text-slate-400 hover:text-white px-4 py-2 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
