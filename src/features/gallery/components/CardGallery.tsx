// Modules
import { useState } from "react";

// Types
import type { DeckEntry, Objective, ScryfallCard } from "@/types";

import { BASIC_LANDS } from "@/features/deckBuilder/utils/basicLands";

// Components
import ObjectivePill from "@/features/objectives/components/ObjectivePill";
import SwapSidebar from "@/features/gallery/components/SwapSidebar";
import SwapBanner from "@/features/gallery/components/SwapBanner";

interface PendingSwap {
  removeCardId: string;
  addCard: ScryfallCard;
}

interface CardGalleryProps {
  entries: DeckEntry[];
  objectives: Objective[];
  pendingSwaps: PendingSwap[];
  onAssign: (cardId: string, objectiveId: string) => void;
  onUnassign: (cardId: string, objectiveId: string) => void;
  onAddSwap: (removeCardId: string, addCard: ScryfallCard) => void;
  onSaveAsVersion: () => void;
  onUndoSwaps: () => void;
}

type SortKey = "type" | "color" | "cmc" | "name";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "type", label: "Type" },
  { key: "color", label: "Color Identity" },
  { key: "cmc", label: "Mana Value" },
  { key: "name", label: "Name" },
];

const COLOR_ORDER = ["W", "U", "B", "R", "G"];

function sortEntries(entries: DeckEntry[], sort: SortKey): DeckEntry[] {
  return [...entries].sort((a, b) => {
    switch (sort) {
      case "name":
        return a.card.name.localeCompare(b.card.name);
      case "cmc":
        return a.card.cmc - b.card.cmc;
      case "type":
        return a.category.localeCompare(b.category);
      case "color": {
        const aFirst = COLOR_ORDER.indexOf(a.card.color_identity[0] ?? "");
        const bFirst = COLOR_ORDER.indexOf(b.card.color_identity[0] ?? "");
        return aFirst - bFirst;
      }
      default:
        return 0;
    }
  });
}

export default function CardGallery({
  entries,
  objectives,
  pendingSwaps,
  onAssign,
  onUnassign,
  onAddSwap,
  onSaveAsVersion,
  onUndoSwaps,
}: CardGalleryProps) {
  const [sort, setSort] = useState<SortKey>("type");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [popover, setPopover] = useState<string | null>(null);
  const [swapping, setSwapping] = useState<ScryfallCard | null>(null);

  const BLACK_LIST = BASIC_LANDS.map(({ type_line }) => type_line);
  const filteredEntries = entries.filter((entry) => {
    const t_line = entry.card.type_line;
    if (t_line) {
      return !BLACK_LIST.includes(t_line);
    }
    return false;
  });

  const safeObjectives = objectives ?? [];
  const sorted = sortEntries(filteredEntries ?? [], sort);

  const swappedOutIds = new Set(pendingSwaps.map((s) => s.removeCardId));

  const handleConfirmSwap = (replacement: ScryfallCard) => {
    if (!swapping) return;
    onAddSwap(swapping.id, replacement);
    setSwapping(null);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Pending swaps banner */}
      <SwapBanner
        swaps={pendingSwaps}
        onSaveAsVersion={onSaveAsVersion}
        onUndo={onUndoSwaps}
      />

      {/* Sort controls */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500 uppercase tracking-widest mr-1">
          Sort by
        </span>
        <div className="flex gap-1 bg-slate-800 p-1 rounded-lg">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSort(opt.key)}
              className="px-3 py-1.5 rounded-md text-xs font-semibold transition-colors hover:cursor-pointer"
              style={{
                backgroundColor: sort === opt.key ? "#1971c2" : "transparent",
                color: sort === opt.key ? "#fff" : "#64748b",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {sorted.map((entry) => {
          const safeObjectiveIds = entry.objectiveIds ?? [];
          const cardObjectives = safeObjectives.filter((o) =>
            safeObjectiveIds.includes(o.id),
          );
          const unassigned = safeObjectives.filter(
            (o) => !safeObjectiveIds.includes(o.id),
          );
          const isExpanded = expanded === entry.card.id;
          const showPopover = popover === entry.card.id;
          const isSwappedOut = swappedOutIds.has(entry.card.id);
          const imageUrl = entry.card.image_uris?.normal;
          const pendingReplacement = pendingSwaps.find(
            (s) => s.removeCardId === entry.card.id,
          )?.addCard;

          return (
            <div
              key={entry.card.id}
              className="flex flex-col gap-2"
              style={{ opacity: isSwappedOut ? 0.5 : 1 }}
            >
              {/* Card image */}
              <div className="relative group">
                {imageUrl ? (
                  <img
                    src={
                      isExpanded
                        ? (entry.card.image_uris?.large ?? imageUrl)
                        : imageUrl
                    }
                    alt={entry.card.name}
                    onClick={() =>
                      !isSwappedOut &&
                      setExpanded(isExpanded ? null : entry.card.id)
                    }
                    className="w-full rounded-xl cursor-pointer transition-transform duration-200 group-hover:scale-[1.02] shadow-lg border border-slate-700"
                    style={{
                      borderColor: isSwappedOut ? "#ef4444" : undefined,
                    }}
                  />
                ) : (
                  <div className="w-full aspect-[5/7] rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                    <span className="text-slate-500 text-xs text-center px-2">
                      {entry.card.name}
                    </span>
                  </div>
                )}

                {/* Quantity badge */}
                {entry.quantity > 1 && (
                  <span className="absolute top-2 right-2 bg-slate-900/90 text-white text-xs font-bold px-1.5 py-0.5 rounded-md border border-slate-700">
                    ×{entry.quantity}
                  </span>
                )}

                {/* Swapped out overlay */}
                {isSwappedOut && (
                  <div className="absolute inset-0 rounded-xl bg-red-950/60 flex items-center justify-center">
                    <span className="text-red-300 text-xs font-semibold">
                      Swapped Out
                    </span>
                  </div>
                )}
              </div>

              {/* Card name */}
              <p className="text-white text-xs font-medium truncate px-0.5">
                {entry.card.name}
              </p>

              {/* Pending replacement indicator */}
              {pendingReplacement && (
                <p className="text-green-400 text-xs px-0.5 truncate">
                  → {pendingReplacement.name}
                </p>
              )}

              {/* Objective pills + action buttons */}
              <div className="flex flex-wrap gap-1 px-0.5">
                {cardObjectives.map((o) => (
                  <ObjectivePill
                    key={o.id}
                    objective={o}
                    onRemove={() => onUnassign(entry.card.id, o.id)}
                  />
                ))}

                {/* Add objective */}
                {safeObjectives.length > 0 &&
                  unassigned.length > 0 &&
                  !isSwappedOut && (
                    <div className="relative">
                      <button
                        onClick={() =>
                          setPopover(showPopover ? null : entry.card.id)
                        }
                        className="text-[10px] text-slate-500 hover:text-slate-300 border border-slate-700 hover:border-slate-500 rounded-full px-2 py-0.5 transition-colors"
                      >
                        + Label
                      </button>
                      {showPopover && (
                        <div className="absolute bottom-full left-0 mb-1 z-20 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-2 flex flex-col gap-1 min-w-[140px]">
                          {unassigned.map((o) => (
                            <button
                              key={o.id}
                              onClick={() => {
                                onAssign(entry.card.id, o.id);
                                setPopover(null);
                              }}
                              className="text-left px-2 py-1 rounded hover:bg-slate-800 transition-colors"
                            >
                              <ObjectivePill objective={o} />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                {/* Swap button */}
                {!isSwappedOut && (
                  <button
                    onClick={() => setSwapping(entry.card)}
                    className="text-[10px] text-slate-500 hover:text-amber-400 border border-slate-700 hover:border-amber-600 rounded-full px-2 py-0.5 transition-colors"
                  >
                    ⇄ Swap
                  </button>
                )}

                {/* Undo individual swap */}
                {isSwappedOut && (
                  <button
                    onClick={() => onUndoSwaps()}
                    className="text-[10px] text-red-400 hover:text-red-300 border border-red-800 rounded-full px-2 py-0.5 transition-colors"
                  >
                    Undo
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Expanded card overlay */}
      {expanded && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center"
          onClick={() => setExpanded(null)}
        >
          {(() => {
            const entry = entries.find((e) => e.card.id === expanded);
            if (!entry?.card.image_uris?.large) return null;
            return (
              <img
                src={entry.card.image_uris.large}
                alt={entry.card.name}
                className="max-h-[90vh] rounded-2xl shadow-2xl border border-slate-700"
                onClick={(e) => e.stopPropagation()}
              />
            );
          })()}
        </div>
      )}

      {/* Swap sidebar */}
      {swapping && (
        <SwapSidebar
          cardToSwap={swapping}
          onConfirm={handleConfirmSwap}
          onClose={() => setSwapping(null)}
        />
      )}
    </div>
  );
}
