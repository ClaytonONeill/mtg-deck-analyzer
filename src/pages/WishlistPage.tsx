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
import type { Deck, CardCategory, WishlistEntry } from "@/types";

// Components
import WishlistAddPanel from "@/features/wishlist/components/WishlistAddPanel";
import WishlistCard from "@/features/wishlist/components/WishlistCard";
import FilterSection from "@/components/FilterSection/FilterSection";

type SortKey = "name" | "cmc" | "color" | "type" | "date";
type SortDirection = "asc" | "desc";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "date", label: "Date Added" },
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

function sortEntries(
  entries: WishlistEntry[],
  sort: SortKey,
  direction: SortDirection,
): WishlistEntry[] {
  const mult = direction === "asc" ? 1 : -1;
  return [...entries].sort((a, b) => {
    switch (sort) {
      case "date":
        return (
          mult * (new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime())
        );
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

export default function WishlistPage() {
  const [allDecks, setAllDecks] = useState<Deck[]>([]);
  const [sort, setSort] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
  const [filters, setFilters] = useState<ActiveFilters>(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false);

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
  const filterCount = activeFilterCount(filters);

  useEffect(() => {
    deckStore.getAll().then(setAllDecks);
  }, []);

  const filtered = useMemo(
    () => applyFilters(entries, filters),
    [entries, filters],
  );

  const sorted = useMemo(
    () => sortEntries(filtered, sort, sortDir),
    [filtered, sort, sortDir],
  );

  const handleClearFilters = () => {
    setFilters(EMPTY_FILTERS);
    setShowFilters(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="px-6 py-4 flex items-center justify-between">
        <button
          onClick={() => navigate("/")}
          className="text-slate-400 hover:text-white text-[16.1px]"
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

        {entries.length > 0 && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
              {/* Label */}
              <span className="text-[13.8px] text-slate-500 uppercase tracking-widest">
                Sort by
              </span>

              {/* Mobile Dropdown */}
              <div className="sm:hidden w-full">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-[14px] text-white focus:outline-none focus:border-[#1971c2]"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.key} value={opt.key}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Desktop Pills */}
              <div className="hidden sm:flex gap-1 bg-slate-800 p-1 rounded-lg">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setSort(opt.key)}
                    className="px-3 py-1.5 rounded-md text-[13.8px] font-semibold transition-colors"
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

              {/* Sort Direction */}
              <button
                onClick={() =>
                  setSortDir((d) => (d === "asc" ? "desc" : "asc"))
                }
                className="flex items-center justify-center gap-1.5 text-[13px] sm:text-[13.8px] font-semibold text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-1.5 rounded-lg transition-colors"
              >
                {sortDir === "asc" ? "↑ Asc" : "↓ Desc"}
              </button>

              {/* Count */}
              <span className="text-[13px] sm:text-[13.8px] text-slate-500 sm:ml-auto">
                {sorted.length} of {entries.length} cards
              </span>
            </div>

            {/* Filter Section */}
            <FilterSection
              isOpen={showFilters}
              onToggle={setShowFilters}
              colorIdentity={COLOR_ORDER}
              cardCategories={CATEGORY_ORDER}
              objectives={allObjectives}
              decks={allDecks}
              draft={filters}
              onChange={(f) => setFilters(f)}
              onClear={handleClearFilters}
              filterCount={filterCount}
            />

            {/* Cards */}
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
