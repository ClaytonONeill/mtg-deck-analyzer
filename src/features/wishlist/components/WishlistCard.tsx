// Modules
import { useState } from "react";

// Types
import type { Deck, Objective, WishlistEntry } from "@/types";

// Components
import CardPrice from "@/components/CardPrice/CardPrice";
import ManaCost from "@/components/ManaSymbol/ManaCost";
import ObjectiveAssignMenu from "@/features/objectives/components/ObjectiveAssignMenu";
import ObjectivePill from "@/features/objectives/components/ObjectivePill";

// Utils
import { getCardImageUris } from "@/utils/cardImage";

// Icons
import { X } from "lucide-react";

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
    <div className="card sm:card-side bg-base-100 border border-base-300 shadow-xl w-full">
      {/* Card Image Section */}
      <figure className="shrink-0 w-full sm:w-48 md:w-56 bg-base-200/50 flex items-center justify-center p-6 sm:p-0">
        {getCardImageUris(entry.card)?.large ? (
          <img
            src={getCardImageUris(entry.card)?.large}
            alt={entry.card.name}
            className="w-2/3 sm:w-full h-auto sm:h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300 rounded-xl sm:rounded-none shadow-lg sm:shadow-none"
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
            <CardPrice card={entry.card} />
          </div>
          {/* btn-md on mobile: the old btn-xs (24px) was too small to tap reliably */}
          <button
            type="button"
            onClick={() => onRemove(entry.id)}
            aria-label={`Remove ${entry.card.name} from wishlist`}
            className="btn btn-ghost btn-md sm:btn-xs btn-circle text-error shrink-0 touch-manipulation -mr-2 -mt-2 sm:m-0"
          >
            <X size={18} />
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
          <div className="flex flex-col gap-2 min-w-0">
            <span className="text-[10px] font-black opacity-40 uppercase tracking-widest">
              Objectives
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              <ObjectiveAssignMenu
                objectives={unassignedObjectives}
                onAssign={(o) => onAssignObjective(entry.id, o)}
                triggerLabel="+ Objective"
                triggerClassName="btn btn-xs btn-outline btn-primary rounded-full"
              />
              {assignedObjectives.map((o) => (
                <ObjectivePill
                  key={o.id}
                  objective={o}
                  onRemove={() => onUnassignObjective(entry.id, o.id)}
                />
              ))}
            </div>
          </div>

          {/* Decks Column */}
          <div className="flex flex-col gap-2 min-w-0">
            <span className="text-[10px] font-black opacity-40 uppercase tracking-widest">
              Tagged Decks
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {untagged.length > 0 && (
                <div className="dropdown dropdown-top dropdown-start shrink-0">
                  <div
                    tabIndex={0}
                    role="button"
                    className="btn btn-xs btn-outline rounded-full"
                  >
                    + Add to Deck
                  </div>
                  <ul
                    tabIndex={0}
                    className="dropdown-content menu flex-nowrap max-h-80 overflow-y-auto p-2 shadow-2xl bg-base-200 border border-base-300 rounded-box w-56 max-w-[calc(100vw-2rem)] mb-2"
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
              {taggedDecks.map((d) => (
                <div
                  key={d.id}
                  className="badge badge-primary badge-outline gap-1 pl-2.5 py-3"
                >
                  <span className="text-xs font-semibold">{d.name}</span>
                  {/* Padding widens the tap target; negative margin keeps the badge the same size */}
                  <button
                    type="button"
                    onClick={() => onUntagDeck(entry.id, d.id)}
                    aria-label={`Untag ${d.name}`}
                    className="hover:text-error transition-colors p-1.5 -m-1.5 touch-manipulation"
                  >
                    <X size={12} strokeWidth={3} />
                  </button>
                </div>
              ))}
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
              src={getCardImageUris(entry.card)?.large}
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
