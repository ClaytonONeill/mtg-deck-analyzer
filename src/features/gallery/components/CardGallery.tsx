// Modules
import { useState } from 'react';

// Types
import type { CardCategory, DeckEntry, Objective, ScryfallCard } from '@/types';

// Utils
import { BASIC_LANDS } from '@/features/deckBuilder/utils/basicLands';

// Components
import ObjectivePill from '@/features/objectives/components/ObjectivePill';
import SwapSidebar from '@/features/gallery/components/SwapSidebar';
import SwapBanner from '@/features/gallery/components/SwapBanner';

// Types
import type { PendingSwap } from '@/types/index';

interface CardGalleryProps {
  deckId: string;
  colorIdentity: string[];
  entries: DeckEntry[];
  objectives: Objective[];
  pendingSwaps: PendingSwap[];
  onAssign: (cardId: string, objectiveId: string) => void;
  onUnassign: (cardId: string, objectiveId: string) => void;
  onAddSwap: (
    removeCardName: string,
    removeCardId: string,
    addCard: ScryfallCard,
  ) => void;
  onSaveAsVersion: () => void;
  onUndoSwaps: () => void;
}

type SortKey = 'type' | 'color' | 'cmc' | 'name';
type SortDirection = 'asc' | 'desc';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'type', label: 'Type' },
  { key: 'color', label: 'Color Identity' },
  { key: 'cmc', label: 'Mana Value' },
  { key: 'name', label: 'Name' },
];

const COLOR_ORDER = ['W', 'U', 'B', 'R', 'G'];
const CATEGORY_ORDER: CardCategory[] = [
  'Creature',
  'Instant',
  'Sorcery',
  'Enchantment',
  'Artifact',
  'Planeswalker',
  'Land',
  'Other',
];

interface ActiveFilters {
  colors: string[];
  types: CardCategory[];
  objectives: string[];
  cmc: { min: number | null; max: number | null };
}

const EMPTY_FILTERS: ActiveFilters = {
  colors: [],
  types: [],
  objectives: [],
  cmc: { min: null, max: null },
};

const ALL_COLORS = ['W', 'U', 'B', 'R', 'G'];

function sortEntries(
  entries: DeckEntry[],
  sort: SortKey,
  direction: SortDirection,
): DeckEntry[] {
  const mult = direction === 'asc' ? 1 : -1;
  return [...entries].sort((a, b) => {
    switch (sort) {
      case 'name':
        return mult * a.card.name.localeCompare(b.card.name);
      case 'cmc':
        return mult * (a.card.cmc - b.card.cmc);
      case 'type':
        return (
          mult *
          (CATEGORY_ORDER.indexOf(a.category) -
            CATEGORY_ORDER.indexOf(b.category))
        );
      case 'color': {
        const aFirst = COLOR_ORDER.indexOf(a.card.color_identity[0] ?? '');
        const bFirst = COLOR_ORDER.indexOf(b.card.color_identity[0] ?? '');
        return mult * (aFirst - bFirst);
      }
      default:
        return 0;
    }
  });
}

function applyFilters(
  entries: DeckEntry[],
  filters: ActiveFilters,
): DeckEntry[] {
  return entries.filter((entry) => {
    if (filters.colors.length > 0) {
      const cardColors = entry.card.color_identity;
      const matches =
        cardColors.some((c) => filters.colors.includes(c)) ||
        (cardColors.length === 0 && filters.colors.includes('C'));
      if (!matches) return false;
    }

    if (filters.types.length > 0) {
      if (!filters.types.includes(entry.category)) return false;
    }

    if (filters.cmc.min !== null && entry.card.cmc < filters.cmc.min)
      return false;
    if (filters.cmc.max !== null && entry.card.cmc > filters.cmc.max)
      return false;

    if (filters.objectives.length > 0) {
      const cardObjectiveIds = entry.objectiveIds ?? [];
      const hasAny = filters.objectives.some((id) =>
        cardObjectiveIds.includes(id),
      );
      if (!hasAny) return false;
    }

    return true;
  });
}

function activeFilterCount(filters: ActiveFilters): number {
  return (
    filters.colors.length +
    filters.types.length +
    filters.objectives.length +
    (filters.cmc.min !== null ? 1 : 0) +
    (filters.cmc.max !== null ? 1 : 0)
  );
}

function toggle<T>(arr: T[], val: T): T[] {
  return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];
}

function FilterPopover({
  objectives,
  draft,
  onChange,
  onApply,
  onClear,
  onClose,
}: {
  objectives: Objective[];
  draft: ActiveFilters;
  onChange: (f: ActiveFilters) => void;
  onApply: () => void;
  onClear: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-20" onClick={onClose} />
      <div className="absolute top-full left-0 mt-2 z-30 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-5 w-80 flex flex-col gap-5">
        {/* Color */}
        <div className="flex flex-col gap-2">
          <p className="text-sm text-slate-400 uppercase tracking-widest">
            Color Identity
          </p>
          <div className="flex gap-2 flex-wrap">
            {ALL_COLORS.map((c) => (
              <button
                key={c}
                onClick={() =>
                  onChange({ ...draft, colors: toggle(draft.colors, c) })
                }
                className="w-8 h-8 rounded-full text-sm font-bold border-2 transition-all"
                style={{
                  borderColor: draft.colors.includes(c) ? '#1971c2' : '#334155',
                  backgroundColor: draft.colors.includes(c)
                    ? '#1971c222'
                    : 'transparent',
                  color: '#f1f5f9',
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Type */}
        <div className="flex flex-col gap-2">
          <p className="text-sm text-slate-400 uppercase tracking-widest">
            Card Type
          </p>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORY_ORDER.map((cat) => (
              <button
                key={cat}
                onClick={() =>
                  onChange({ ...draft, types: toggle(draft.types, cat) })
                }
                className="text-sm px-2.5 py-1 rounded-full border transition-all"
                style={{
                  borderColor: draft.types.includes(cat)
                    ? '#1971c2'
                    : '#334155',
                  backgroundColor: draft.types.includes(cat)
                    ? '#1971c222'
                    : 'transparent',
                  color: draft.types.includes(cat) ? '#1971c2' : '#94a3b8',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* CMC range */}
        <div className="flex flex-col gap-2">
          <p className="text-sm text-slate-400 uppercase tracking-widest">
            Mana Value (CMC)
          </p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              placeholder="Min"
              value={draft.cmc.min ?? ''}
              onChange={(e) =>
                onChange({
                  ...draft,
                  cmc: {
                    ...draft.cmc,
                    min: e.target.value === '' ? null : Number(e.target.value),
                  },
                })
              }
              className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-[#1971c2] transition-colors"
            />
            <span className="text-slate-500 text-sm">—</span>
            <input
              type="number"
              min={0}
              placeholder="Max"
              value={draft.cmc.max ?? ''}
              onChange={(e) =>
                onChange({
                  ...draft,
                  cmc: {
                    ...draft.cmc,
                    max: e.target.value === '' ? null : Number(e.target.value),
                  },
                })
              }
              className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-[#1971c2] transition-colors"
            />
          </div>
        </div>

        {/* Objectives checklist */}
        {objectives.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-slate-400 uppercase tracking-widest">
              Objectives
            </p>
            <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto">
              {objectives.map((o) => {
                const checked = draft.objectives.includes(o.id);
                return (
                  <label
                    key={o.id}
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() =>
                      onChange({
                        ...draft,
                        objectives: toggle(draft.objectives, o.id),
                      })
                    }
                  >
                    <div
                      className="w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all"
                      style={{
                        borderColor: checked ? o.color : '#475569',
                        backgroundColor: checked ? o.color : 'transparent',
                      }}
                    >
                      {checked && (
                        <span className="text-white text-[10px] leading-none font-bold">
                          ✓
                        </span>
                      )}
                    </div>
                    <ObjectivePill objective={o} size="sm" />
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1 border-t border-slate-800">
          <button
            onClick={onApply}
            className="flex-1 bg-[#1971c2] hover:bg-blue-500 text-white text-sm font-semibold py-2 rounded-lg transition-colors"
          >
            Apply
          </button>
          <button
            onClick={onClear}
            className="text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-4 py-2 rounded-lg transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
    </>
  );
}

export default function CardGallery({
  deckId,
  colorIdentity,
  entries,
  objectives,
  pendingSwaps,
  onAssign,
  onUnassign,
  onAddSwap,
  onSaveAsVersion,
  onUndoSwaps,
}: CardGalleryProps) {
  const [sort, setSort] = useState<SortKey>('type');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [popover, setPopover] = useState<string | null>(null);
  const [swapping, setSwapping] = useState<ScryfallCard | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [draftFilters, setDraftFilters] =
    useState<ActiveFilters>(EMPTY_FILTERS);
  const [activeFilters, setActiveFilters] =
    useState<ActiveFilters>(EMPTY_FILTERS);

  const BLACK_LIST = BASIC_LANDS.map(({ type_line }) => type_line);
  const filteredEntries = (entries ?? []).filter((entry) => {
    const t_line = entry.card.type_line;
    return t_line ? !BLACK_LIST.includes(t_line) : false;
  });

  const safeObjectives = objectives ?? [];
  const swappedOutIds = new Set(pendingSwaps.map((s) => s.removeCardId));
  const filterCount = activeFilterCount(activeFilters);

  const handleApplyFilters = () => {
    setActiveFilters({ ...draftFilters });
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    setDraftFilters(EMPTY_FILTERS);
    setActiveFilters(EMPTY_FILTERS);
    setShowFilters(false);
  };

  const handleOpenFilters = () => {
    setDraftFilters({ ...activeFilters });
    setShowFilters(true);
  };

  const handleConfirmSwap = (replacement: ScryfallCard) => {
    if (!swapping) return;
    onAddSwap(swapping.name, swapping.id, replacement);
    setSwapping(null);
  };

  const filtered = applyFilters(filteredEntries, activeFilters);
  const sorted = sortEntries(filtered, sort, sortDir);

  return (
    <div className="flex flex-col gap-4">
      {/* Pending swaps banner */}
      <SwapBanner
        swaps={pendingSwaps}
        onSaveAsVersion={onSaveAsVersion}
        onUndo={onUndoSwaps}
      />

      {/* Controls row */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm text-slate-500 uppercase tracking-widest">
          Sort by
        </span>

        {/* Sort key */}
        <div className="flex gap-1 bg-slate-800 p-1 rounded-lg">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setSort(opt.key)}
              className="px-3 py-1.5 rounded-md text-sm font-semibold transition-colors hover:cursor-pointer"
              style={{
                backgroundColor: sort === opt.key ? '#1971c2' : 'transparent',
                color: sort === opt.key ? '#fff' : '#64748b',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Sort direction */}
        <button
          onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
          className="flex items-center gap-1.5 text-sm font-semibold text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-1.5 rounded-lg transition-colors"
        >
          {sortDir === 'asc' ? '↑ Asc' : '↓ Desc'}
        </button>

        {/* Filter button */}
        <div className="relative">
          <button
            onClick={handleOpenFilters}
            className="flex items-center gap-1.5 text-sm font-semibold border px-3 py-1.5 rounded-lg transition-colors"
            style={{
              borderColor: filterCount > 0 ? '#1971c2' : '#334155',
              color: filterCount > 0 ? '#1971c2' : '#94a3b8',
              backgroundColor: filterCount > 0 ? '#1971c211' : 'transparent',
            }}
          >
            Filter
            {filterCount > 0 && (
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: '#1971c2', color: '#fff' }}
              >
                {filterCount}
              </span>
            )}
          </button>

          {showFilters && (
            <FilterPopover
              objectives={safeObjectives}
              draft={draftFilters}
              onChange={setDraftFilters}
              onApply={handleApplyFilters}
              onClear={handleClearFilters}
              onClose={() => setShowFilters(false)}
            />
          )}
        </div>

        {/* Result count */}
        <span className="text-sm text-slate-500 ml-auto">
          {sorted.length} of {filteredEntries.length} cards
        </span>
      </div>

      {/* Empty state */}
      {sorted.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500 text-sm gap-2">
          <p>No cards match the current filters.</p>
          <button
            onClick={handleClearFilters}
            className="text-[#1971c2] hover:underline text-sm"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-4 gap-6">
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
          const imageUrl = entry.card.image_uris?.large;
          const pendingReplacement = pendingSwaps.find(
            (s) => s.removeCardId === entry.card.id,
          )?.addCard;

          return (
            <div
              key={entry.card.id}
              className="flex flex-col gap-3"
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
                    className="md:w-full rounded-xl cursor-pointer transition-transform duration-200 group-hover:scale-[1.02] shadow-lg border border-slate-700"
                    style={{
                      borderColor: isSwappedOut ? '#ef4444' : undefined,
                    }}
                  />
                ) : (
                  <div className="w-full aspect-5/7 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                    <span className="text-slate-500 text-sm text-center px-2">
                      {entry.card.name}
                    </span>
                  </div>
                )}

                {entry.quantity > 1 && (
                  <span className="absolute top-2 right-2 bg-slate-900/90 text-white text-sm font-bold px-2 py-1 rounded-md border border-slate-700">
                    ×{entry.quantity}
                  </span>
                )}

                {isSwappedOut && (
                  <div className="absolute inset-0 rounded-xl bg-red-950/60 flex items-center justify-center">
                    <span className="text-red-300 text-sm font-semibold">
                      Swapped Out
                    </span>
                  </div>
                )}
              </div>

              {/* Card name */}
              <p className="text-white text-sm font-medium truncate px-0.5">
                {entry.card.name}
              </p>

              {/* Pending replacement */}
              {pendingReplacement && (
                <p className="text-green-400 text-sm px-0.5 truncate">
                  → {pendingReplacement.name}
                </p>
              )}

              {/* Objective pills + action buttons */}
              <div className="flex flex-wrap gap-1.5 px-0.5">
                {cardObjectives.map((o) => (
                  <ObjectivePill
                    key={o.id}
                    objective={o}
                    onRemove={() => onUnassign(entry.card.id, o.id)}
                  />
                ))}

                {safeObjectives.length > 0 &&
                  unassigned.length > 0 &&
                  !isSwappedOut && (
                    <div className="relative">
                      <button
                        onClick={() =>
                          setPopover(showPopover ? null : entry.card.id)
                        }
                        className="text-sm text-slate-500 hover:text-slate-300 border border-slate-700 hover:border-slate-500 rounded-full px-2.5 py-1 transition-colors"
                      >
                        + Objective
                      </button>
                      {showPopover && (
                        <div
                          className="absolute bottom-full left-0 mb-2 z-20 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-2 flex flex-col gap-1 w-max"
                          onClick={(e) => e.stopPropagation()} // prevents accidental bubbling
                        >
                          {/* Header with close button */}
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-slate-400 uppercase tracking-widest">
                              Add Objective
                            </span>
                            <button
                              onClick={() => setPopover(null)}
                              className="text-slate-400 hover:text-white text-sm px-1.5 py-0.5 rounded transition-colors"
                            >
                              ✕
                            </button>
                          </div>

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

                {!isSwappedOut && (
                  <button
                    onClick={() => setSwapping(entry.card)}
                    className="text-sm text-slate-500 hover:text-amber-400 border border-slate-700 hover:border-amber-600 rounded-full px-2.5 py-1 transition-colors"
                  >
                    ⇄ Swap
                  </button>
                )}

                {isSwappedOut && (
                  <button
                    onClick={() => onUndoSwaps()}
                    className="text-sm text-red-400 hover:text-red-300 border border-red-800 rounded-full px-2.5 py-1 transition-colors"
                  >
                    Undo
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Expanded overlay */}
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
          deckId={deckId}
          colorIdentity={colorIdentity}
          onConfirm={handleConfirmSwap}
          onClose={() => setSwapping(null)}
        />
      )}
    </div>
  );
}
