// Modules
import { useState } from "react";

// Types
import type { WishlistEntry } from "@/types";

// Store
import { deckStore } from "@/store/deckStore";

// Components
import ManaCost from "@/components/ManaSymbol/ManaCost";
import ColorPip from "@/components/ManaSymbol/ColorPip";

interface WishlistCardProps {
  entry: WishlistEntry;
  onRemove: (id: string) => void;
  onTagDeck: (entryId: string, deckId: string) => void;
  onUntagDeck: (entryId: string, deckId: string) => void;
  onUpdateNote: (entryId: string, note: string) => void;
}

export default function WishlistCard({
  entry,
  onRemove,
  onTagDeck,
  onUntagDeck,
  onUpdateNote,
}: WishlistCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [noteVal, setNoteVal] = useState(entry.note);

  const allDecks = deckStore.getAll();
  const taggedDecks = allDecks.filter((d) => entry.deckIds.includes(d.id));
  const untagged = allDecks.filter((d) => !entry.deckIds.includes(d.id));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div className="flex gap-3 p-3">
        {/* Card image */}
        <div className="shrink-0 w-16">
          {entry.card.image_uris?.small ? (
            <img
              src={entry.card.image_uris.small}
              alt={entry.card.name}
              className="w-full rounded-lg cursor-pointer hover:scale-105 transition-transform"
              onClick={() => setExpanded((v) => !v)}
            />
          ) : (
            <div className="w-full aspect-5/7 rounded-lg bg-slate-800 flex items-center justify-center">
              <span className="text-slate-500 text-[10px] text-center px-1">
                {entry.card.name}
              </span>
            </div>
          )}
        </div>

        {/* Card info */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-white font-semibold text-sm truncate">
              {entry.card.name}
            </p>
            <button
              onClick={() => onRemove(entry.id)}
              className="text-slate-600 hover:text-red-400 transition-colors shrink-0 text-xs"
            >
              ✕
            </button>
          </div>

          <p className="text-slate-500 text-xs">{entry.card.type_line}</p>

          <div className="flex items-center gap-2 flex-wrap">
            {entry.card.cmc > 0 && (
              <ManaCost cost={entry.card.mana_cost} size={12} />
            )}
            {(entry.card.color_identity ?? []).map((c) => (
              <ColorPip key={c} color={c} size={14} />
            ))}
          </div>

          {/* Deck tags */}
          <div className="flex flex-wrap gap-1 mt-0.5">
            {taggedDecks.map((d) => (
              <span
                key={d.id}
                className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: "#1971c222",
                  color: "#1971c2",
                  border: "1px solid #1971c255",
                }}
              >
                {d.name}
                <button
                  onClick={() => onUntagDeck(entry.id, d.id)}
                  className="hover:opacity-70 transition-opacity"
                >
                  ×
                </button>
              </span>
            ))}

            {/* Tag deck dropdown */}
            {untagged.length > 0 && (
              <select
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) {
                    onTagDeck(entry.id, e.target.value);
                    e.target.value = "";
                  }
                }}
                className="text-[10px] text-slate-500 bg-slate-800 border border-slate-700 rounded-full px-2 py-0.5 focus:outline-none focus:border-[#1971c2] transition-colors cursor-pointer"
              >
                <option value="" disabled>
                  + Deck
                </option>
                {untagged.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Note */}
          {editingNote ? (
            <div className="flex gap-1 mt-1">
              <input
                type="text"
                value={noteVal}
                onChange={(e) => setNoteVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    onUpdateNote(entry.id, noteVal);
                    setEditingNote(false);
                  }
                  if (e.key === "Escape") setEditingNote(false);
                }}
                autoFocus
                className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[#1971c2] transition-colors"
              />
              <button
                onClick={() => {
                  onUpdateNote(entry.id, noteVal);
                  setEditingNote(false);
                }}
                className="text-xs text-[#1971c2] hover:text-blue-400 px-1"
              >
                Save
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingNote(true)}
              className="text-left text-xs text-slate-500 hover:text-slate-300 transition-colors mt-0.5 truncate"
            >
              {entry.note ? entry.note : "+ Add note"}
            </button>
          )}
        </div>
      </div>

      {/* Expanded image */}
      {expanded && entry.card.image_uris?.normal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center"
          onClick={() => setExpanded(false)}
        >
          <img
            src={entry.card.image_uris.normal}
            alt={entry.card.name}
            className="max-h-[90vh] rounded-2xl shadow-2xl border border-slate-700"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
