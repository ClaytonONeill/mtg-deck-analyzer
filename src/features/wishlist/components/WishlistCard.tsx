// Modules
import { useState } from "react";

// Types
import type { Deck, Objective, WishlistEntry } from "@/types";

// Components
import ManaCost from "@/components/ManaSymbol/ManaCost";
import ObjectivePill from "@/features/objectives/components/ObjectivePill";

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
    <div className="card lg:card-side bg-base-100 border border-base-300 shadow-xl overflow-hidden w-full">
      {/* Card Image Section */}
      <figure className="shrink-0 w-full sm:w-56 md:w-48 bg-base-300">
        {entry.card.image_uris?.large ? (
          <img
            src={entry.card.image_uris.large}
            alt={entry.card.name}
            className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
            onClick={() => setExpanded(true)}
          />
        ) : (
          <div className="flex items-center justify-center p-4 text-center">
            <span className="text-xs opacity-40 font-bold uppercase tracking-tighter">
              {entry.card.name}
            </span>
          </div>
        )}
      </figure>

      <div className="card-body p-4 sm:p-6 gap-4">
        {/* Header */}
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0">
            <h3 className="card-title text-base-content truncate">
              {entry.card.name}
            </h3>
            <p className="text-xs opacity-60">{entry.card.type_line}</p>
          </div>
          <button
            onClick={() => onRemove(entry.id)}
            className="btn btn-ghost btn-xs btn-circle text-error"
          >
            ✕
          </button>
        </div>

        {/* Mana Cost */}
        {entry.card.cmc > 0 && (
          <div className="flex">
            <ManaCost cost={entry.card.mana_cost} size={16} />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          {/* Objectives Column */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-black opacity-40 uppercase tracking-widest">
              Objectives
            </span>
            <div className="flex flex-wrap gap-1.5">
              {assignedObjectives.map((o) => (
                <ObjectivePill
                  key={o.id}
                  objective={o}
                  onRemove={() => onUnassignObjective(entry.id, o.id)}
                />
              ))}

              {unassignedObjectives.length > 0 && (
                <div className="dropdown dropdown-top md:dropdown-right">
                  <div
                    tabIndex={0}
                    role="button"
                    className="btn btn-xs btn-outline btn-primary rounded-full"
                  >
                    + Objective
                  </div>
                  <ul
                    tabIndex={0}
                    className="dropdown-content z-[1] menu p-2 shadow-2xl bg-base-200 border border-base-300 rounded-box w-52 mb-2"
                  >
                    {unassignedObjectives.map((o) => (
                      <li key={o.id}>
                        <button
                          onClick={() => onAssignObjective(entry.id, o)}
                          className="text-xs"
                        >
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: o.color }}
                          />
                          {o.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Decks Column */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-black opacity-40 uppercase tracking-widest">
              Tagged Decks
            </span>
            <div className="flex flex-wrap gap-1.5">
              {taggedDecks.map((d) => (
                <div
                  key={d.id}
                  className="badge badge-primary badge-outline gap-1 pl-2.5 py-3"
                >
                  <span className="text-xs font-semibold">{d.name}</span>
                  <button
                    onClick={() => onUntagDeck(entry.id, d.id)}
                    className="hover:text-error transition-colors"
                  >
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ))}

              {untagged.length > 0 && (
                <div className="dropdown dropdown-top md:dropdown-right">
                  <div
                    tabIndex={0}
                    role="button"
                    className="btn btn-xs btn-outline rounded-full"
                  >
                    + Add to Deck
                  </div>
                  <ul
                    tabIndex={0}
                    className="dropdown-content z-[1] menu p-2 shadow-2xl bg-base-200 border border-base-300 rounded-box w-52 mb-2"
                  >
                    {untagged.map((d) => (
                      <li key={d.id}>
                        <button
                          onClick={() => onTagDeck(entry.id, d.id)}
                          className="text-xs"
                        >
                          {d.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Modal */}
      {expanded && (
        <div
          className="modal modal-open modal-middle backdrop-blur-md bg-black/40"
          onClick={() => setExpanded(false)}
        >
          <div
            className="relative max-w-sm mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={entry.card.image_uris?.large}
              alt={entry.card.name}
              className="rounded-2xl shadow-2xl ring-1 ring-white/20"
            />
            <button
              onClick={() => setExpanded(false)}
              className="btn btn-circle btn-sm absolute -top-2 -right-2 btn-primary border-2 border-base-100"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
