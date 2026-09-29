// Modules
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

// Hooks
import { useWishlist } from "@/hooks/useWishlist";
import { useObjectives } from "@/hooks/useObjectives";
import { useCardPrices } from "@/hooks/useCardPriceContext";

// Store
import { deckStore } from "@/store/deckStore";

// Context
import { CardPriceProvider } from "@/context/CardPriceContext";

// Utils
import { inferCategory } from "@/utils/utils";
import {
  sortCards,
  CATEGORY_ORDER,
  type CardSortKey,
  type SortDirection,
} from "@/utils/sortCards";

// Types
import type { Deck, CardCategory, Objective, WishlistEntry } from "@/types";

// Components
import WishlistAddPanel from "@/features/wishlist/components/WishlistAddPanel";
import WishlistCard from "@/features/wishlist/components/WishlistCard";
import FilterSection from "@/components/FilterSection/FilterSection";
import ThenBySelect from "@/components/ThenBySelect/ThenBySelect";
import PageShell from "@/components/PageShell/PageShell";

type SortKey = CardSortKey;

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "date", label: "Date Added" },
  { key: "name", label: "Name" },
  { key: "cmc", label: "Mana Value" },
  { key: "color", label: "Color Identity" },
  { key: "type", label: "Type" },
  { key: "price", label: "Price" },
];

const COLOR_ORDER = ["W", "U", "B", "R", "G"];

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
  const [thenBy, setThenBy] = useState<SortKey | null>(null);
  const [filters, setFilters] = useState<ActiveFilters>(EMPTY_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);

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
    deckStore.getAll().then((decks) => {
      setAllDecks(decks);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(
    () => applyFilters(entries, filters),
    [entries, filters],
  );

  if (loading) {
    return (
      <PageShell tone="recessed" className="flex flex-col gap-4 items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p className="text-base-content/70 text-sm font-semibold">
          Loading wishlist...
        </p>
      </PageShell>
    );
  }

  return (
    <CardPriceProvider cardIds={entries.map((e) => e.card.id)}>
    <PageShell tone="recessed" className="pb-20">
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 bg-base-100/80 backdrop-blur-md border-b border-base-300 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="btn btn-ghost btn-sm gap-2"
          >
            ← <span className="hidden sm:inline">Back</span>
          </button>
          <h1 className="text-lg font-black uppercase tracking-widest">
            Wishlist
          </h1>
          <div className="badge badge-ghost font-mono">{entries.length}</div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-10">
        {/* Input Panel */}
        <section>
          <WishlistAddPanel
            onAdd={addCard}
            existingCardIds={existingCardIds}
            allDecks={allDecks}
          />
        </section>

        {entries.length > 0 && (
          <WishlistResults
            filtered={filtered}
            totalCount={entries.length}
            sort={sort}
            setSort={setSort}
            thenBy={thenBy}
            setThenBy={setThenBy}
            sortDir={sortDir}
            setSortDir={setSortDir}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            filters={filters}
            setFilters={setFilters}
            filterCount={filterCount}
            allDecks={allDecks}
            allObjectives={allObjectives}
            onRemove={removeEntry}
            onTagDeck={tagDeck}
            onUntagDeck={untagDeck}
            onAssignObjective={assignObjective}
            onUnassignObjective={unassignObjective}
          />
        )}
      </main>
    </PageShell>
    </CardPriceProvider>
  );
}

interface WishlistResultsProps {
  filtered: WishlistEntry[];
  totalCount: number;
  sort: SortKey;
  setSort: (sort: SortKey) => void;
  thenBy: SortKey | null;
  setThenBy: (key: SortKey | null) => void;
  sortDir: SortDirection;
  setSortDir: (fn: (d: SortDirection) => SortDirection) => void;
  showFilters: boolean;
  setShowFilters: (open: boolean) => void;
  filters: ActiveFilters;
  setFilters: (filters: ActiveFilters) => void;
  filterCount: number;
  allDecks: Deck[];
  allObjectives: Objective[];
  onRemove: (id: string) => void;
  onTagDeck: (entryId: string, deckId: string) => void;
  onUntagDeck: (entryId: string, deckId: string) => void;
  onAssignObjective: (entryId: string, objective: Objective) => void;
  onUnassignObjective: (entryId: string, objectiveId: string) => void;
}

// Rendered inside WishlistPage's CardPriceProvider so "Price" sort can read
// live-refreshed prices, not just whatever's baked into each stored card.
function WishlistResults({
  filtered,
  totalCount,
  sort,
  setSort,
  thenBy,
  setThenBy,
  sortDir,
  setSortDir,
  showFilters,
  setShowFilters,
  filters,
  setFilters,
  filterCount,
  allDecks,
  allObjectives,
  onRemove,
  onTagDeck,
  onUntagDeck,
  onAssignObjective,
  onUnassignObjective,
}: WishlistResultsProps) {
  const livePrices = useCardPrices();

  const sorted = useMemo(
    () => sortCards(filtered, sort, thenBy, sortDir, livePrices),
    [filtered, sort, thenBy, sortDir, livePrices],
  );

  const selectSort = (key: SortKey) => {
    setSort(key);
    if (thenBy === key) setThenBy(null);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Sorting & Stats Row */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between bg-base-100 p-4 rounded-2xl shadow-sm border border-base-300">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[10px] font-black opacity-40 uppercase tracking-widest">
            Sort By
          </span>

          {/* Mobile Sort Dropdown */}
          <select
            className="select select-bordered select-sm md:hidden"
            value={sort}
            onChange={(e) => selectSort(e.target.value as SortKey)}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Desktop Sort Join */}
          <div className="join hidden md:inline-flex">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => selectSort(opt.key)}
                className={`join-item btn btn-xs px-4 ${sort === opt.key ? "btn-primary" : "btn-ghost bg-base-200"}`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
            className="btn btn-sm btn-ghost border-base-300"
          >
            {sortDir === "asc" ? "Asc." : "Desc."}
          </button>
          <ThenBySelect
            options={SORT_OPTIONS}
            primary={sort}
            value={thenBy}
            onChange={setThenBy}
          />
        </div>

        <span className="text-xs font-bold opacity-40">
          SHOWING {sorted.length} / {totalCount}
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
        onChange={setFilters}
        onClear={() => setFilters(EMPTY_FILTERS)}
        filterCount={filterCount}
      />

      {/* Result Grid */}
      <div className="grid grid-cols-1 gap-6">
        {sorted.map((entry) => (
          <WishlistCard
            key={entry.id}
            entry={entry}
            allDecks={allDecks}
            allObjectives={allObjectives}
            onRemove={onRemove}
            onTagDeck={onTagDeck}
            onUntagDeck={onUntagDeck}
            onAssignObjective={onAssignObjective}
            onUnassignObjective={onUnassignObjective}
          />
        ))}
      </div>
    </div>
  );
}
