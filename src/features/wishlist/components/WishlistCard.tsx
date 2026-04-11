// Modules
import { useState } from 'react';

// Types
import type { Deck, Objective, WishlistEntry } from '@/types';

// Components
import ManaCost from '@/components/ManaSymbol/ManaCost';
import ObjectivePill from '@/features/objectives/components/ObjectivePill';

interface WishlistCardProps {
  entry: WishlistEntry;
  allDecks: Deck[];
  allObjectives: Objective[];
  onRemove: (id: string) => void;
  onTagDeck: (entryId: string, deckId: string) => void;
  onUntagDeck: (entryId: string, deckId: string) => void;
  onAssignObjective: (entryId: string, objective: Objective) => void;
  onUnassignObjective: (entryId: string, objectiveId: string) => void;
}

export default function WishlistCard({
  entry,
  allDecks,
  allObjectives,
  onRemove,
  onTagDeck,
  onUntagDeck,
  onAssignObjective,
  onUnassignObjective,
}: WishlistCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [showPopover, setShowPopover] = useState(false);
  const [showDeckPopover, setShowDeckPopover] = useState(false);

  const taggedDecks = allDecks.filter((d) =>
    (entry.deckIds ?? []).includes(d.id),
  );
  const untagged = allDecks.filter(
    (d) => !(entry.deckIds ?? []).includes(d.id),
  );
  const assignedObjectives = entry.objectives ?? [];
  const assignedIds = assignedObjectives.map((o) => o.id);
  const unassignedObjectives = allObjectives.filter(
    (o) => !assignedIds.includes(o.id),
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full h-full">
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 sm:p-4">
        {/* Card image */}
        <div className="shrink-0 w-full sm:w-56 md:w-48 self-start">
          {entry.card.image_uris?.large ? (
            <img
              src={entry.card.image_uris.large}
              alt={entry.card.name}
              className="w-full sm:w-full md:w-xl cursor-pointer transition-transform shadow-lg sm:rounded-xl sm:border sm:border-slate-700 sm:hover:scale-105"
              onClick={() => setExpanded((v) => !v)}
            />
          ) : (
            <div className="w-full aspect-5/7 bg-slate-800 sm:rounded-xl sm:border sm:border-slate-700 flex items-center justify-center">
              <span className="text-slate-500 text-xs text-center px-2">
                {entry.card.name}
              </span>
            </div>
          )}
        </div>

        {/* Right content */}
        <div className="flex flex-col gap-3 flex-1 min-w-0 px-3 py-3 sm:p-4">
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

          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 min-h-0">
            {/* Objectives Column */}
            <div className="flex flex-col border border-slate-800 rounded-xl p-2 min-h-0 relative">
              <div className="text-xs text-slate-400 mb-1">Objectives</div>

              <div className="flex-1 overflow-y-auto pr-1 flex flex-wrap gap-1.5 content-start">
                {assignedObjectives.map((o) => (
                  <ObjectivePill
                    key={o.id}
                    objective={o}
                    onRemove={() => onUnassignObjective(entry.id, o.id)}
                  />
                ))}
              </div>

              {showPopover && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowPopover(false)}
                  />
                  <div className="absolute bottom-10 left-0 mt-2 z-20 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-2 flex flex-col gap-1 w-max">
                    {unassignedObjectives.map((o) => (
                      <button
                        key={o.id}
                        onClick={() => {
                          onAssignObjective(entry.id, o);
                          setShowPopover(false);
                        }}
                        className="text-left px-2 py-1 rounded hover:bg-slate-800 transition-colors"
                      >
                        <ObjectivePill objective={o} />
                      </button>
                    ))}
                  </div>
                </>
              )}

              {allObjectives.length > 0 && unassignedObjectives.length > 0 && (
                <button
                  onClick={() => setShowPopover((v) => !v)}
                  className="text-sm text-slate-500 hover:text-slate-300 border border-slate-700 hover:border-slate-500 rounded-full mt-2 px-2 py-0.5 h-7 transition-colors"
                >
                  + Objective
                </button>
              )}
            </div>

            {/* Decks Column */}
            <div className="flex flex-col border border-slate-800 rounded-xl p-2 min-h-0 relative">
              <div className="text-xs text-slate-400 mb-1">Decks</div>
              <div className="flex-1 overflow-y-auto pr-1 flex flex-wrap gap-1.5 content-start">
                {taggedDecks.map((d) => (
                  <span
                    key={d.id}
                    className="inline-flex items-center gap-1 text-sm font-semibold px-2.5 py-1 rounded-full"
                    style={{
                      backgroundColor: '#1971c222',
                      color: '#1971c2',
                      border: '1px solid #1971c255',
                    }}
                  >
                    {d.name}
                    <button
                      onClick={() => onUntagDeck(entry.id, d.id)}
                      className="hover:opacity-70 leading-none"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              {showDeckPopover && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowDeckPopover(false)}
                  />
                  <div className="absolute bottom-10 left-0 mt-2 z-20 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-2 flex flex-col gap-1 w-max min-w-[120px]">
                    {untagged.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => {
                          onTagDeck(entry.id, d.id);
                          setShowDeckPopover(false);
                        }}
                        className="text-left px-3 py-1.5 rounded text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                      >
                        {d.name}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {untagged.length > 0 && (
                <button
                  onClick={() => setShowDeckPopover((v) => !v)}
                  className="text-sm text-slate-500 hover:text-slate-300 border border-slate-700 hover:border-slate-500 rounded-full mt-2 px-2 py-0.5 h-7 transition-colors"
                >
                  + Add to Deck
                </button>
              )}
            </div>
          </div>
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
