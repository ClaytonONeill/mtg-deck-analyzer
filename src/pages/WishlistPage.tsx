// Modules
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

// Hooks
import { useWishlist } from "@/hooks/useWishlist";
import { useObjectives } from "@/hooks/useObjectives";

// Store
import { deckStore } from "@/store/deckStore";

// Utils
import { inferCategory } from "@/utils/utils";

// Types
import type { Deck, CardCategory, Objective, WishlistEntry } from "@/types";

// Components
import WishlistAddPanel from "@/features/wishlist/components/WishlistAddPanel";
import WishlistCard from "@/features/wishlist/components/WishlistCard";
import ObjectivePill from "@/features/objectives/components/ObjectivePill";

type SortKey = "name" | "cmc" | "color" | "type";
type SortDirection = "asc" | "desc";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "cmc", label: "Mana Value" },
  { key: "color", label: "Color Identity" },
  { key: "type", label: "Type" },
];

const COLOR_ORDER = ["W", "U", "B", "R", "G"];

const CATEGORY_ORDER: CardCategory[] = [
  "Creature",
  "Instant",
  "Sorcery",
  "Enchantment",
  "Artifact",
  "Planeswalker",
  "Land",
  "Other",
];

interface ActiveFilters {
  colors: string[];
  types: CardCategory[];
  objectives: string[];
  decks: string[];
  cmc: { min: number | null; max: number | null };
}

const EMPTY_FILTERS: ActiveFilters = {
  colors: [],
  types: [],
  objectives: [],
  decks: [],
  cmc: { min: null, max: null },
};

function activeFilterCount(filters: ActiveFilters): number {
  return (
    filters.colors.length +
    filters.types.length +
    filters.objectives.length +
    filters.decks.length +
    (filters.cmc.min !== null ? 1 : 0) +
    (filters.cmc.max !== null ? 1 : 0)
  );
}

function toggle<T>(arr: T[], val: T): T[] {
  return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];
}

function sortEntries(
  entries: WishlistEntry[],
  sort: SortKey,
  direction: SortDirection,
): WishlistEntry[] {
  const mult = direction === "asc" ? 1 : -1;
  return [...entries].sort((a, b) => {
    switch (sort) {
      case "name":
        return mult * a.card.name.localeCompare(b.card.name);
      case "cmc":
        return mult * (a.card.cmc - b.card.cmc);
      case "type": {
        const aCat = CATEGORY_ORDER.indexOf(inferCategory(a.card.type_line));
        const bCat = CATEGORY_ORDER.indexOf(inferCategory(b.card.type_line));
        return mult * (aCat - bCat);
      }
      case "color": {
        const aFirst = COLOR_ORDER.indexOf(
          (a.card.color_identity ?? [])[0] ?? "",
        );
        const bFirst = COLOR_ORDER.indexOf(
          (b.card.color_identity ?? [])[0] ?? "",
        );
        return mult * (aFirst - bFirst);
      }
      default:
        return 0;
    }
  });
}

function applyFilters(
  entries: WishlistEntry[],
  filters: ActiveFilters,
): WishlistEntry[] {
  return entries.filter((entry) => {
    if (filters.colors.length > 0) {
      const cardColors = entry.card.color_identity ?? [];
      const matches =
        cardColors.some((c) => filters.colors.includes(c)) ||
        (cardColors.length === 0 && filters.colors.includes("C"));
      if (!matches) return false;
    }
    if (filters.types.length > 0) {
      if (!filters.types.includes(inferCategory(entry.card.type_line)))
        return false;
    }
    if (filters.cmc.min !== null && entry.card.cmc < filters.cmc.min)
      return false;
    if (filters.cmc.max !== null && entry.card.cmc > filters.cmc.max)
      return false;
    if (filters.decks.length > 0) {
      if (!filters.decks.some((id) => entry.deckIds.includes(id))) return false;
    }
    if (filters.objectives.length > 0) {
      const entryObjectiveIds = (entry.objectives ?? []).map((o) => o.id);
      if (!filters.objectives.some((id) => entryObjectiveIds.includes(id)))
        return false;
    }
    return true;
  });
}

function FilterPopover({
  draft,
  allDecks,
  allObjectives,
  onChange,
  onApply,
  onClear,
  onClose,
}: {
  draft: ActiveFilters;
  allDecks: { id: string; name: string }[];
  allObjectives: Objective[];
  onChange: (f: ActiveFilters) => void;
  onApply: () => void;
  onClear: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-20" onClick={onClose} />
      <div className="absolute top-full left-0 mt-2 z-30 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-5 w-80 flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <p className="text-[13.8px] text-slate-400 uppercase tracking-widest">
            Color Identity
          </p>
          <div className="flex gap-2 flex-wrap">
            {COLOR_ORDER.map((c) => (
              <button
                key={c}
                onClick={() =>
                  onChange({ ...draft, colors: toggle(draft.colors, c) })
                }
                className="w-8 h-8 rounded-full text-[13.8px] font-bold border-2 transition-all"
                style={{
                  borderColor: draft.colors.includes(c) ? "#1971c2" : "#334155",
                  backgroundColor: draft.colors.includes(c)
                    ? "#1971c222"
                    : "transparent",
                  color: "#f1f5f9",
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-[13.8px] text-slate-400 uppercase tracking-widest">
            Card Type
          </p>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORY_ORDER.map((cat) => (
              <button
                key={cat}
                onClick={() =>
                  onChange({ ...draft, types: toggle(draft.types, cat) })
                }
                className="text-[13.8px] px-2.5 py-1 rounded-full border transition-all"
                style={{
                  borderColor: draft.types.includes(cat)
                    ? "#1971c2"
                    : "#334155",
                  backgroundColor: draft.types.includes(cat)
                    ? "#1971c222"
                    : "transparent",
                  color: draft.types.includes(cat) ? "#1971c2" : "#94a3b8",
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-[13.8px] text-slate-400 uppercase tracking-widest">
            Mana Value (CMC)
          </p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              placeholder="Min"
              value={draft.cmc.min ?? ""}
              onChange={(e) =>
                onChange({
                  ...draft,
                  cmc: {
                    ...draft.cmc,
                    min: e.target.value === "" ? null : Number(e.target.value),
                  },
                })
              }
              className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-[16.1px] text-white focus:outline-none focus:border-[#1971c2] transition-colors"
            />
            <span className="text-slate-500 text-[16.1px]">—</span>
            <input
              type="number"
              min={0}
              placeholder="Max"
              value={draft.cmc.max ?? ""}
              onChange={(e) =>
                onChange({
                  ...draft,
                  cmc: {
                    ...draft.cmc,
                    max: e.target.value === "" ? null : Number(e.target.value),
                  },
                })
              }
              className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-[16.1px] text-white focus:outline-none focus:border-[#1971c2] transition-colors"
            />
          </div>
        </div>

        {allObjectives.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-[13.8px] text-slate-400 uppercase tracking-widest">
              Objectives
            </p>
            <div className="flex flex-wrap gap-1.5">
              {allObjectives.map((o) => (
                <button
                  key={o.id}
                  onClick={() =>
                    onChange({
                      ...draft,
                      objectives: toggle(draft.objectives, o.id),
                    })
                  }
                  className="transition-all rounded-full"
                  style={{
                    outline: draft.objectives.includes(o.id)
                      ? `2px solid ${o.color}`
                      : "2px solid transparent",
                    outlineOffset: "2px",
                  }}
                >
                  <ObjectivePill objective={o} size="sm" />
                </button>
              ))}
            </div>
          </div>
        )}

        {allDecks.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-[13.8px] text-slate-400 uppercase tracking-widest">
              Decks
            </p>
            <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto">
              {allDecks.map((deck) => {
                const checked = draft.decks.includes(deck.id);
                return (
                  <label
                    key={deck.id}
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() =>
                      onChange({
                        ...draft,
                        decks: toggle(draft.decks, deck.id),
                      })
                    }
                  >
                    <div
                      className="w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all"
                      style={{
                        borderColor: checked ? "#1971c2" : "#475569",
                        backgroundColor: checked ? "#1971c2" : "transparent",
                      }}
                    >
                      {checked && (
                        <span className="text-white text-[10px] leading-none font-bold">
                          ✓
                        </span>
                      )}
                    </div>
                    <span
                      className="text-[13.8px] font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: "#1971c222",
                        color: "#1971c2",
                        border: "1px solid #1971c255",
                      }}
                    >
                      {deck.name}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-1 border-t border-slate-800">
          <button
            onClick={onApply}
            className="flex-1 bg-[#1971c2] hover:bg-blue-500 text-white text-[16.1px] font-semibold py-2 rounded-lg transition-colors"
          >
            Apply
          </button>
          <button
            onClick={onClear}
            className="text-[16.1px] text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-4 py-2 rounded-lg transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
    </>
  );
}

export default function WishlistPage() {
  // State
  const [allDecks, setAllDecks] = useState<Deck[]>([]);
  const [sort, setSort] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDirection>("asc");
  const [draftFilters, setDraftFilters] =
    useState<ActiveFilters>(EMPTY_FILTERS);
  const [activeFilters, setActiveFilters] =
    useState<ActiveFilters>(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false);

  // Hooks
  const navigate = useNavigate();

  const {
    entries,
    addCard,
    removeEntry,
    tagDeck,
    untagDeck,
    assignObjective,
    unassignObjective,
  } = useWishlist();

  const { objectives: allObjectives } = useObjectives();

  const existingCardIds = entries.map((e) => e.card.id);

  const filterCount = activeFilterCount(activeFilters);

  // Effects
  useEffect(() => {
    deckStore.getAll().then(setAllDecks);
  }, []);

  const filtered = useMemo(
    () => applyFilters(entries, activeFilters),
    [entries, activeFilters],
  );
  const sorted = useMemo(
    () => sortEntries(filtered, sort, sortDir),
    [filtered, sort, sortDir],
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="px-6 py-4 flex items-center justify-between">
        <button
          onClick={() => navigate("/")}
          className="text-slate-400 hover:text-white text-[16.1px] transition-colors hover:cursor-pointer"
        >
          ← Back
        </button>
        <h1 className="text-[20.7px] font-bold text-white">Wishlist</h1>
        <span className="text-[16.1px] text-slate-500">
          {entries.length} card{entries.length !== 1 ? "s" : ""}
        </span>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8 flex flex-col gap-8">
        <WishlistAddPanel
          onAdd={addCard}
          existingCardIds={existingCardIds}
          allDecks={allDecks}
        />

        {entries.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
            <div className="text-[55px]">✨</div>
            <p className="text-slate-400 text-[16.1px]">
              Your wishlist is empty.
            </p>
            <p className="text-slate-600 text-[13.8px] max-w-xs">
              Search for cards above to add them. Tag them to decks so they
              appear in that deck's Wishlist tab.
            </p>
          </div>
        )}

        {entries.length > 0 && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-[13.8px] text-slate-500 uppercase tracking-widest">
                Sort by
              </span>

              <div className="flex gap-1 bg-slate-800 p-1 rounded-lg">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setSort(opt.key)}
                    className="px-3 py-1.5 rounded-md text-[13.8px] font-semibold transition-colors hover:cursor-pointer"
                    style={{
                      backgroundColor:
                        sort === opt.key ? "#1971c2" : "transparent",
                      color: sort === opt.key ? "#fff" : "#64748b",
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() =>
                  setSortDir((d) => (d === "asc" ? "desc" : "asc"))
                }
                className="flex items-center gap-1.5 text-[13.8px] font-semibold text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-1.5 rounded-lg transition-colors"
              >
                {sortDir === "asc" ? "↑ Asc" : "↓ Desc"}
              </button>

              <div className="relative">
                <button
                  onClick={() => {
                    setDraftFilters({ ...activeFilters });
                    setShowFilters(true);
                  }}
                  className="flex items-center gap-1.5 text-[13.8px] font-semibold border px-3 py-1.5 rounded-lg transition-colors"
                  style={{
                    borderColor: filterCount > 0 ? "#1971c2" : "#334155",
                    color: filterCount > 0 ? "#1971c2" : "#94a3b8",
                    backgroundColor:
                      filterCount > 0 ? "#1971c211" : "transparent",
                  }}
                >
                  Filter
                  {filterCount > 0 && (
                    <span
                      className="text-[11.5px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: "#1971c2", color: "#fff" }}
                    >
                      {filterCount}
                    </span>
                  )}
                </button>

                {showFilters && (
                  <FilterPopover
                    draft={draftFilters}
                    allDecks={allDecks}
                    allObjectives={allObjectives}
                    onChange={setDraftFilters}
                    onApply={() => {
                      setActiveFilters({ ...draftFilters });
                      setShowFilters(false);
                    }}
                    onClear={() => {
                      setDraftFilters(EMPTY_FILTERS);
                      setActiveFilters(EMPTY_FILTERS);
                      setShowFilters(false);
                    }}
                    onClose={() => setShowFilters(false)}
                  />
                )}
              </div>

              <span className="text-[13.8px] text-slate-500 ml-auto">
                {sorted.length} of {entries.length} cards
              </span>
            </div>

            {sorted.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500 text-[16.1px] gap-2">
                <p>No cards match the current filters.</p>
                <button
                  onClick={() => {
                    setDraftFilters(EMPTY_FILTERS);
                    setActiveFilters(EMPTY_FILTERS);
                  }}
                  className="text-[#1971c2] hover:underline text-[13.8px]"
                >
                  Clear filters
                </button>
              </div>
            )}

            <div className="flex flex-col gap-6 items-center w-full">
              {sorted.map((entry) => (
                <WishlistCard
                  key={entry.id}
                  entry={entry}
                  allDecks={allDecks}
                  allObjectives={allObjectives}
                  onRemove={removeEntry}
                  onTagDeck={tagDeck}
                  onUntagDeck={untagDeck}
                  onAssignObjective={assignObjective}
                  onUnassignObjective={unassignObjective}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
