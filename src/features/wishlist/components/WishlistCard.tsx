// Modules
import { useState } from 'react';

// Types
import type { Deck, WishlistEntry } from '@/types';

// Components
import ManaCost from '@/components/ManaSymbol/ManaCost';

interface WishlistCardProps {
  entry: WishlistEntry;
  allDecks: Deck[];
  onRemove: (id: string) => void;
  onTagDeck: (entryId: string, deckId: string) => void;
  onUntagDeck: (entryId: string, deckId: string) => void;
  onUpdateNote: (entryId: string, note: string) => void;
}

export default function WishlistCard({
  entry,
  allDecks,
  onRemove,
  onTagDeck,
  onUntagDeck,
  onUpdateNote,
}: WishlistCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [noteVal, setNoteVal] = useState(entry.note);
  const [noteDirty, setNoteDirty] = useState(false);

  const taggedDecks = allDecks.filter((d) => entry.deckIds.includes(d.id));
  const untagged = allDecks.filter((d) => !entry.deckIds.includes(d.id));

  const handleNoteBlur = () => {
    if (noteDirty) {
      onUpdateNote(entry.id, noteVal);
      setNoteDirty(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full h-full overflow-hidden">
      <div className="flex flex-col sm:flex-row gap-0 sm:gap-4 sm:p-4">
        {/* Card image */}
        <div className="shrink-0 w-full sm:w-56 md:w-48 self-start flex justify-center">
          {entry.card.image_uris?.normal ? (
            <img
              src={entry.card.image_uris.normal}
              alt={entry.card.name}
              className="w-3/4 sm:rounded-xl cursor-pointer sm:hover:scale-105 transition-transform shadow-lg sm:border sm:border-slate-700"
              onClick={() => setExpanded((v) => !v)}
            />
          ) : (
            <div className="w-full aspect-[5/7] bg-slate-800 sm:rounded-xl sm:border sm:border-slate-700 flex items-center justify-center">
              <span className="text-slate-500 text-xs text-center px-2">
                {entry.card.name}
              </span>
            </div>
          )}
        </div>

        {/* Right content */}
        <div className="flex flex-col gap-3 flex-1 min-w-0 p-4 sm:p-0">
          {/* Title row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col gap-0.5 min-w-0">
              <h3 className="text-white font-bold text-base truncate">
                {entry.card.name}
              </h3>
              <p className="text-slate-400 text-sm">{entry.card.type_line}</p>
            </div>
            <button
              onClick={() => onRemove(entry.id)}
              className="text-slate-600 hover:text-red-400 transition-colors text-sm shrink-0 ml-1"
            >
              ✕
            </button>
          </div>

          {/* Mana cost */}
          {entry.card.cmc > 0 && (
            <ManaCost cost={entry.card.mana_cost} size={16} />
          )}

          {/* Deck tags */}
          <div className="flex flex-wrap gap-1.5 min-w-0">
            {taggedDecks.map((d) => (
              <span
                key={d.id}
                className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full shrink-0"
                style={{
                  backgroundColor: '#1971c222',
                  color: '#1971c2',
                  border: '1px solid #1971c255',
                }}
              >
                {d.name}
                <button
                  onClick={() => onUntagDeck(entry.id, d.id)}
                  className="hover:opacity-70 transition-opacity leading-none"
                >
                  ×
                </button>
              </span>
            ))}

            {untagged.length > 0 && (
              <select
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) {
                    onTagDeck(entry.id, e.target.value);
                    e.target.value = '';
                  }
                }}
                className="text-xs text-slate-400 bg-slate-800 border border-slate-700 rounded-full px-2.5 py-1 focus:outline-none focus:border-[#1971c2] transition-colors cursor-pointer max-w-full min-w-0"
              >
                <option value="" disabled>
                  + Add to Deck
                </option>
                {untagged.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Note textarea */}
          <textarea
            value={noteVal}
            onChange={(e) => {
              setNoteVal(e.target.value);
              setNoteDirty(true);
            }}
            onBlur={handleNoteBlur}
            placeholder="Add note..."
            rows={3}
            className="w-full h-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#1971c2] transition-colors resize-none"
          />
        </div>
      </div>

      {/* Expanded image overlay */}
      {expanded && entry.card.image_uris?.large && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center"
          onClick={() => setExpanded(false)}
        >
          <img
            src={entry.card.image_uris.large}
            alt={entry.card.name}
            className="max-h-[90vh] rounded-2xl shadow-2xl border border-slate-700"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
