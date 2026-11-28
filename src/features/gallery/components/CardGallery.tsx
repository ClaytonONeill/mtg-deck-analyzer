import { useState, useMemo, useEffect, useRef } from "react";

// Types
import type {
  DeckEntry,
  DeckFormat,
  Objective,
  ScryfallCard,
  PendingSwap,
} from "@/types";

// Hooks
import { useWishlist } from "@/hooks/useWishlist";
import { useLocalStorage } from "@/hooks/useLocalStorage";

// Utils
import { BASIC_LANDS } from "@/features/deckBuilder/utils/basicLands";

// Components
import CardPrice from "@/components/CardPrice/CardPrice";
import FlippableCardImage from "@/components/FlippableCardImage/FlippableCardImage";
import ObjectiveAssignMenu from "@/features/objectives/components/ObjectiveAssignMenu";
import ObjectivePill from "@/features/objectives/components/ObjectivePill";

// Hooks
import { useCardLegalities, useCardPrices } from "@/hooks/useCardPriceContext";
import { checkCardAdd, getRules } from "@/features/formats/formats";

// Utils
import {
  sortCards,
  CATEGORY_ORDER,
  type CardSortKey,
  type SortDirection,
} from "@/utils/sortCards";
import SwapSidebar from "@/features/gallery/components/SwapSidebar";
import SwapBanner from "@/features/gallery/components/SwapBanner";
import FilterSection, {
  type ActiveFilters,
} from "@/components/FilterSection/FilterSection";
import {
  CARD_ROLES,
  detectCardRoles,
} from "@/features/recommendations/utils/deckSignals";
import {
  MV_TOP,
  UNTAGGED,
  matchesColors,
} from "@/components/FilterSection/filterConstants";
import ThenBySelect from "@/components/ThenBySelect/ThenBySelect";

// Icons
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

interface CardGalleryProps {
  deckId: string;
  format: DeckFormat;
  colorIdentity: string[];
  commander?: ScryfallCard | null;
  partner?: ScryfallCard | null;
  entries: DeckEntry[];
  /** Counted toward copy limits when checking a swap-in. */
  sideboard?: DeckEntry[];
  objectives: Objective[];
  /** Deck-level strategic objectives, used by swap suggestions. */
  strategyObjectives?: Objective[];
  pendingSwaps: PendingSwap[];
  onAssign: (cardId: string, objectiveId: string) => void;
  onUnassign: (cardId: string, objectiveId: string) => void;
  onAddSwap: (
    removeCardName: string,
    removeCardId: string,
    addCard: ScryfallCard,
  ) => void;
  onSaveAsVersion: () => void;
  onUndoSwap: (removeCardId: string) => void;
}

type SortKey = Exclude<CardSortKey, "date">;

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "type", label: "Type" },
  { key: "color", label: "Color" },
  { key: "cmc", label: "Mana" },
  { key: "name", label: "Name" },
  { key: "price", label: "Price" },
];

// The direction each sort reads most naturally in when first picked.
const NATURAL_DIRECTION: Record<SortKey, SortDirection> = {
  type: "asc",
  color: "asc",
  cmc: "asc",
  name: "asc",
  price: "desc",
};

type GalleryFilters = Omit<ActiveFilters, "decks" | "cmc">;
const EMPTY_GALLERY_FILTERS: GalleryFilters = {
  colors: [],
  types: [],
  objectives: [],
  manaValues: [],
  roles: [],
};

const ROLE_NAME = Object.fromEntries(CARD_ROLES.map((r) => [r.id, r.name]));

/** Lowercased name + type line + rules text, both faces of DFCs included. */
function searchText(card: ScryfallCard): string {
  const faces = card.card_faces ?? [];
  return [
    card.name,
    card.type_line,
    card.oracle_text,
    ...faces.flatMap((f) => [f.type_line, f.oracle_text]),
  ]
    .filter(Boolean)
    .join("\n")
    .toLowerCase();
}

// Mobile-only cards-per-row setting; sm+ keeps the responsive 2/3/4 columns.
type MobileColumns = 1 | 2 | 3;
const MOBILE_GRID_COLS: Record<MobileColumns, string> = {
  1: "grid-cols-1 gap-8",
  2: "grid-cols-2 gap-3",
  3: "grid-cols-3 gap-2",
};

/** Horizontal swipe distance (px) that counts as "next/previous card". */
const SWIPE_THRESHOLD = 50;

export default function CardGallery({
  deckId,
  format,
  colorIdentity,
  commander,
  partner,
  entries,
  sideboard = [],
  objectives,
  strategyObjectives = [],
  pendingSwaps,
  onAssign,
  onUnassign,
  onAddSwap,
  onSaveAsVersion,
  onUndoSwap,
}: CardGalleryProps) {
  // Sort preferences persist across visits; filters/search only for this
  // browser session (and per deck), so they survive switching tabs but can't
  // silently hide cards days later.
  const [sort, setSort] = useLocalStorage<SortKey>("gallery-sort", "type");
  const [thenBy, setThenBy] = useLocalStorage<CardSortKey | null>(
    "gallery-then-by",
    null,
  );
  const [sortDir, setSortDir] = useLocalStorage<SortDirection>(
    "gallery-sort-dir",
    NATURAL_DIRECTION.type,
  );
  const [query, setQuery] = useLocalStorage(`gallery-query:${deckId}`, "", "session");
  const [filters, setFilters] = useLocalStorage(
    `gallery-filters:${deckId}`,
    EMPTY_GALLERY_FILTERS,
    "session",
  );
  const [storedMobileCols, setMobileCols] = useLocalStorage<number>(
    "gallery-mobile-columns",
    1,
  );
  const mobileCols: MobileColumns = [1, 2, 3].includes(storedMobileCols)
    ? (storedMobileCols as MobileColumns)
    : 1;
  // Denser mobile grids need compact tile controls to fit.
  const dense = mobileCols > 1;
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const [expandedCard, setExpandedCard] = useState<ScryfallCard | null>(null);
  // Which face each double-faced card is showing, shared by the tile and the
  // enlarged view so opening a flipped tile keeps it flipped.
  const [faceById, setFaceById] = useState<Record<string, number>>({});
  const faceProps = (id: string) => ({
    face: faceById[id] ?? 0,
    onFaceChange: (face: number) =>
      setFaceById((prev) => ({ ...prev, [id]: face })),
  });
  const [commanderCardVisible, setCommanderCardVisible] = useState(true);
  const [swapping, setSwapping] = useState<ScryfallCard | null>(null);
  const [swappedEntries, setSwappedEntries] = useState<ScryfallCard[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const { getForDeck } = useWishlist();
  const deckWishlist = getForDeck(deckId);
  // Pending swaps per card id. A card with several copies can be swapped
  // out one copy at a time; it only counts as swapped out once every copy is.
  const swapCounts = new Map<string, number>();
  for (const s of pendingSwaps) {
    swapCounts.set(s.removeCardId, (swapCounts.get(s.removeCardId) ?? 0) + 1);
  }
  const swappedOutIds = new Set(
    (entries ?? [])
      .filter((e) => (swapCounts.get(e.card.id) ?? 0) >= e.quantity)
      .map((e) => e.card.id),
  );
  const livePrices = useCardPrices();
  const liveLegalities = useCardLegalities();

  /** Can `card` replace one copy of the card being swapped out? Checked
   * against the deck with every pending swap applied. Swaps are
   * one-for-one, so deck size never changes. */
  const checkSwapIn = (card: ScryfallCard) => {
    let list: DeckEntry[] = (entries ?? []).map((e) => ({ ...e }));
    const drop = (id: string) => {
      list = list
        .map((e) => (e.card.id === id ? { ...e, quantity: e.quantity - 1 } : e))
        .filter((e) => e.quantity > 0);
    };
    const add = (c: ScryfallCard) => {
      const i = list.findIndex((e) => e.card.id === c.id);
      if (i >= 0) list[i] = { ...list[i], quantity: list[i].quantity + 1 };
      else list.push({ card: c, quantity: 1, category: "Other", objectiveIds: [] });
    };
    for (const s of pendingSwaps) {
      drop(s.removeCardId);
      add(s.addCard);
    }
    if (swapping) drop(swapping.id);
    return checkCardAdd(
      {
        format,
        commander: commander ?? null,
        partner: partner ?? null,
        colorIdentity,
        entries: list,
        sideboard,
      },
      card,
      "main",
      { ignoreSize: true, live: liveLegalities },
    );
  };

  // Basic lands never show in the gallery, so they're excluded from the
  // "x / y" total too — otherwise the counter never adds up with no filters.
  const galleryEntries = useMemo(() => {
    const basics = BASIC_LANDS.map((b) => b.type_line);
    return (entries ?? []).filter(
      (e) => !basics.includes(e.card.type_line ?? ""),
    );
  }, [entries]);

  // Card Roles are derived from rules text, once per card.
  const rolesByCard = useMemo(
    () => new Map(galleryEntries.map((e) => [e.card.id, detectCardRoles(e.card)])),
    [galleryEntries],
  );

  // Only roles/objectives that actually occur in this deck are offered as
  // filters, each with its card count.
  const roleOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const roles of rolesByCard.values())
      for (const r of roles) counts.set(r, (counts.get(r) ?? 0) + 1);
    return CARD_ROLES.filter((r) => counts.has(r.id)).map((r) => ({
      ...r,
      count: counts.get(r.id)!,
    }));
  }, [rolesByCard]);

  const objectiveCounts = useMemo(() => {
    const counts: Record<string, number> = { [UNTAGGED]: 0 };
    for (const e of galleryEntries) {
      const ids = e.objectiveIds ?? [];
      if (ids.length === 0) counts[UNTAGGED]++;
      for (const id of ids) counts[id] = (counts[id] ?? 0) + 1;
    }
    return counts;
  }, [galleryEntries]);

  const activeRoles = useMemo(() => filters.roles ?? [], [filters.roles]);
  const activeManaValues = useMemo(
    () => filters.manaValues ?? [],
    [filters.manaValues],
  );

  const filterCount =
    activeRoles.length +
    filters.colors.length +
    filters.types.length +
    filters.objectives.length +
    activeManaValues.length;

  const filteredAndSorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    const result = galleryEntries.filter((e) => {
      if (q && !searchText(e.card).includes(q)) return false;
      if (!matchesColors(e.card.color_identity ?? [], filters.colors))
        return false;
      if (
        activeRoles.length &&
        !(rolesByCard.get(e.card.id) ?? []).some((r) => activeRoles.includes(r))
      )
        return false;
      if (filters.types.length && !filters.types.includes(e.category))
        return false;
      if (filters.objectives.length) {
        const ids = e.objectiveIds ?? [];
        const hit =
          ids.some((id) => filters.objectives.includes(id)) ||
          (ids.length === 0 && filters.objectives.includes(UNTAGGED));
        if (!hit) return false;
      }
      if (
        activeManaValues.length &&
        !activeManaValues.includes(Math.min(Math.floor(e.card.cmc ?? 0), MV_TOP))
      )
        return false;
      return true;
    });
    return sortCards(result, sort, thenBy, sortDir, livePrices);
  }, [galleryEntries, rolesByCard, activeRoles, activeManaValues, query, filters, sort, thenBy, sortDir, livePrices]);

  const clearAll = () => {
    setFilters(EMPTY_GALLERY_FILTERS);
    setQuery("");
  };

  // Each sort starts in its natural direction (A–Z, cheap→expensive, type
  // order); the Asc/Desc button still flips it.
  const selectSort = (key: SortKey) => {
    setSort(key);
    setSortDir(NATURAL_DIRECTION[key]);
    if (thenBy === key) setThenBy(null);
  };

  // Cards reachable with arrow keys / swipe from the enlarged view: the grid's
  // current order, minus swapped-out cards (which can't be opened either).
  // Commander/partner aren't in the grid, so they have no neighbors.
  const navigableCards = filteredAndSorted
    .filter((e) => !swappedOutIds.has(e.card.id))
    .map((e) => e.card);
  const expandedIndex = expandedCard
    ? navigableCards.findIndex((c) => c.id === expandedCard.id)
    : -1;
  const prevCard = expandedIndex > 0 ? navigableCards[expandedIndex - 1] : null;
  const nextCard =
    expandedIndex >= 0 && expandedIndex < navigableCards.length - 1
      ? navigableCards[expandedIndex + 1]
      : null;

  useEffect(() => {
    if (!expandedCard) return;
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, select, textarea")) return;
      if (e.key === "ArrowLeft" && prevCard) setExpandedCard(prevCard);
      else if (e.key === "ArrowRight" && nextCard) setExpandedCard(nextCard);
      else if (e.key === "Escape") setExpandedCard(null);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [expandedCard, prevCard, nextCard]);

  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0 && nextCard) setExpandedCard(nextCard);
    else if (dx > 0 && prevCard) setExpandedCard(prevCard);
  };

  const renderCommanderTile = (card: ScryfallCard) => (
    <div
      key={card.id}
      className="flex flex-col gap-3 group transition-all duration-300"
    >
      <div className="relative">
        <FlippableCardImage
          card={card}
          size="large"
          {...faceProps(card.id)}
          onClick={() => setExpandedCard(card)}
          className="w-full rounded-2xl shadow-2xl border border-base-300 transition-all duration-500 cursor-zoom-in group-hover:scale-[1.03] group-hover:border-primary/50 ring-0 group-hover:ring-4 ring-primary/10"
        />
      </div>

      <div className="px-2 space-y-3">
        <div className="flex flex-col">
          <h3 className="text-base font-bold truncate tracking-tight">
            {card.name}
          </h3>
          <CardPrice card={card} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <SwapBanner
        swaps={pendingSwaps}
        onSaveAsVersion={onSaveAsVersion}
        onUndo={onUndoSwap}
      />

      {/* Search: name, type line and rules text */}
      <label className="input input-sm md:input-md flex items-center gap-2 w-full md:max-w-md bg-base-100">
        <Search size={16} className="opacity-50 shrink-0" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Search cards — "Sol Ring", "flying", "draw a card"'
          className="grow min-w-0"
          aria-label="Search cards in this deck"
        />
      </label>

      {/* --- DASHBOARD STYLE CONTROLS --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-base-200/50 p-4 rounded-2xl border border-base-300 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-black text-primary/usage uppercase tracking-widest hidden sm:inline">
              Sort by
            </span>
            <div className="join bg-base-100 border border-base-300 shadow-sm">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => selectSort(opt.key)}
                  className={`join-item btn btn-sm px-4 border-none transition-all ${sort === opt.key ? "btn-primary" : "btn-ghost opacity-60"}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
            className="btn btn-sm btn-ghost bg-base-100 border border-base-300 shadow-sm font-bold px-4 self-start sm:self-auto"
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

        <div className="flex items-center justify-between md:justify-end gap-6">
          <div className="flex items-center gap-2 sm:hidden">
            <span className="text-xs font-bold opacity-60">Per row</span>
            <div className="join bg-base-100 border border-base-300 shadow-sm">
              {([1, 2, 3] as const).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setMobileCols(n)}
                  aria-label={`${n} card${n > 1 ? "s" : ""} per row`}
                  aria-pressed={mobileCols === n}
                  className={`join-item btn btn-sm px-3 border-none ${mobileCols === n ? "btn-primary" : "btn-ghost opacity-60"}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs font-mono font-bold opacity-40 uppercase tracking-tighter">
              Inventory
            </span>
            <span className="text-sm font-bold">
              {filteredAndSorted.length} / {galleryEntries.length}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start gap-3">
        <FilterSection
          isOpen={showFilters}
          onToggle={setShowFilters}
          colorIdentity={[...colorIdentity, "C"]}
          cardCategories={CATEGORY_ORDER}
          objectives={objectives}
          allowUntagged
          objectiveCounts={objectiveCounts}
          roles={roleOptions}
          showManaValue
          draft={{ ...filters, decks: [], cmc: { min: null, max: null } }}
          onChange={(f) =>
            setFilters({
              colors: f.colors,
              types: f.types,
              objectives: f.objectives,
              manaValues: f.manaValues ?? [],
              roles: f.roles ?? [],
            })
          }
          onClear={() => setFilters(EMPTY_GALLERY_FILTERS)}
          filterCount={filterCount}
        />

        {(commander || partner) && (
          <button
            onClick={() => setCommanderCardVisible((v) => !v)}
            className="btn btn-sm w-full sm:w-auto btn-outline border-base-300 opacity-70"
          >
            {commanderCardVisible ? "Hide" : "Show"} Commander
            {partner ? "s" : ""}
          </button>
        )}
      </div>

      {/* --- COMMANDER ROW --- */}
      {commanderCardVisible && (commander || partner) && (
        <div
          className={`grid ${MOBILE_GRID_COLS[mobileCols]} sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-8`}
        >
          {commander && renderCommanderTile(commander)}
          {partner && renderCommanderTile(partner)}
        </div>
      )}

      {filteredAndSorted.length === 0 && galleryEntries.length > 0 && (
        <div className="text-center py-12 space-y-3">
          <p className="text-base md:text-lg text-base-content/60">
            No cards match your search and filters.
          </p>
          <button type="button" onClick={clearAll} className="btn btn-sm btn-ghost text-sm">
            Clear search & filters
          </button>
        </div>
      )}

      {/* --- GRID (1-3 cols mobile per user setting, up to 4 on desktop) --- */}
      <div
        className={`grid ${MOBILE_GRID_COLS[mobileCols]} sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-8`}
      >
        {filteredAndSorted.map((entry) => {
          const isSwapped = swappedOutIds.has(entry.card.id);
          const replacements = pendingSwaps
            .filter((s) => s.removeCardId === entry.card.id)
            .map((s) => s.addCard.name);
          const partlySwapped = !isSwapped && replacements.length > 0;
          const cardObjectives = (objectives ?? []).filter((o) =>
            (entry.objectiveIds ?? []).includes(o.id),
          );
          const unassigned = (objectives ?? []).filter(
            (o) => !(entry.objectiveIds ?? []).includes(o.id),
          );

          return (
            <div
              key={entry.card.id}
              className={`flex flex-col gap-3 group transition-all duration-300 ${isSwapped ? "opacity-40 grayscale-[0.3]" : "opacity-100"}`}
            >
              <div className="relative">
                <FlippableCardImage
                  card={entry.card}
                  size="large"
                  {...faceProps(entry.card.id)}
                  onClick={() => !isSwapped && setExpandedCard(entry.card)}
                  className={`w-full rounded-2xl shadow-2xl border border-base-300 transition-all duration-500 ${!isSwapped ? "cursor-zoom-in group-hover:scale-[1.03] group-hover:border-primary/50 ring-0 group-hover:ring-4 ring-primary/10" : "border-error/30"}`}
                />

                {entry.quantity > 1 && (
                  <div className="absolute top-4 right-4 badge badge-neutral badge-lg font-black border-base-300 shadow-xl">
                    ×{entry.quantity}
                  </div>
                )}

                {isSwapped && (
                  <div className="absolute inset-0 bg-error/10 backdrop-blur-[1px] rounded-2xl flex items-center justify-center">
                    <div className="bg-error text-error-content text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-2xl border border-white/20">
                      Swapped Out
                    </div>
                  </div>
                )}
              </div>

              <div className={`${dense ? "px-0 sm:px-2" : "px-2"} space-y-3`}>
                <div className="flex flex-col min-w-0">
                  <h3
                    className={`${dense ? "text-sm sm:text-base" : "text-base"} font-bold truncate tracking-tight`}
                  >
                    {entry.card.name}
                  </h3>
                  <CardPrice card={entry.card} />
                  {replacements.length > 0 && (
                    <span className="text-success text-xs md:text-sm font-bold italic">
                      {partlySwapped && `${replacements.length} of ${entry.quantity}: `}→{" "}
                      {replacements.join(", ")}
                    </span>
                  )}
                </div>

                {/* Card Roles: auto-detected, neutral so they read as facts
                    about the card, distinct from the user's colored objectives */}
                {(rolesByCard.get(entry.card.id) ?? []).length > 0 && (
                  <div className={`${dense ? "hidden sm:flex" : "flex"} flex-wrap gap-1`} aria-label="Card roles">
                    {rolesByCard.get(entry.card.id)!.map((id) => (
                      <span
                        key={id}
                        className="rounded-md border border-base-content/15 bg-base-200 px-1.5 py-0.5 text-xs md:text-sm text-base-content/70"
                      >
                        {ROLE_NAME[id]}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-1.5 min-h-[32px]">
                  {!isSwapped ? (
                    <div
                      className={`flex items-center w-full ${dense ? "gap-1 sm:gap-2" : "gap-2"}`}
                    >
                      <ObjectiveAssignMenu
                        objectives={unassigned}
                        onAssign={(o) => onAssign(entry.card.id, o.id)}
                        triggerLabel="+"
                        triggerClassName={`btn btn-ghost ${dense ? "btn-sm sm:btn-md" : "btn-md"} btn-circle bg-base-200 border-none opacity-60 hover:opacity-100 hover:bg-primary hover:text-primary-content`}
                      />
                      <button
                        onClick={() => setSwapping(entry.card)}
                        aria-label={`Swap ${entry.card.name}`}
                        className={`btn btn-ghost ${dense ? "btn-sm sm:btn-md px-2 sm:px-4" : "btn-md px-4"} rounded-full bg-base-200 border-none opacity-60 hover:opacity-100  transition-all`}
                      >
                        ⇄
                        <span className={dense ? "hidden sm:inline" : ""}>
                          Swap
                        </span>
                      </button>
                      {partlySwapped && (
                        <button
                          onClick={() => onUndoSwap(entry.card.id)}
                          className={`btn btn-error btn-outline ${dense ? "btn-sm sm:btn-md px-2" : "btn-md px-3"} rounded-full`}
                        >
                          Undo
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => onUndoSwap(entry.card.id)}
                      className={`btn btn-error btn-outline ${dense ? "btn-sm sm:btn-md px-2 sm:px-4" : "btn-md px-4"} rounded-full`}
                    >
                      Undo Swap
                    </button>
                  )}
                  {cardObjectives.map((o) => (
                    <ObjectivePill
                      key={o.id}
                      objective={o}
                      onRemove={() => onUnassign(entry.card.id, o.id)}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* --- NATIVE MODAL --- */}
      <dialog
        className={`modal modal-bottom sm:modal-middle ${expandedCard ? "modal-open" : ""}`}
        onClick={() => setExpandedCard(null)}
      >
        <div
          className="modal-box p-0 bg-transparent shadow-none w-auto max-w-none flex items-center gap-4"
          onClick={(e) => e.stopPropagation()}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Desktop-only arrow hints; mobile uses swipe */}
          {expandedIndex >= 0 && (
            <button
              type="button"
              onClick={() => prevCard && setExpandedCard(prevCard)}
              disabled={!prevCard}
              aria-label="Previous card"
              className="hidden sm:flex btn btn-ghost btn-circle text-white/70 hover:text-white disabled:bg-transparent disabled:opacity-0"
            >
              <ChevronLeft size={32} />
            </button>
          )}
          {expandedCard && (
            <FlippableCardImage
              key={expandedCard.id}
              card={expandedCard}
              size="large"
              buttonSize="md"
              {...faceProps(expandedCard.id)}
              className="max-h-[85vh] w-auto rounded-[3%] shadow-2xl ring-1 ring-white/20 animate-in zoom-in-95 duration-200"
            />
          )}
          {expandedIndex >= 0 && (
            <button
              type="button"
              onClick={() => nextCard && setExpandedCard(nextCard)}
              disabled={!nextCard}
              aria-label="Next card"
              className="hidden sm:flex btn btn-ghost btn-circle text-white/70 hover:text-white disabled:bg-transparent disabled:opacity-0"
            >
              <ChevronRight size={32} />
            </button>
          )}
        </div>
        <form
          method="dialog"
          className="modal-backdrop bg-black/80 backdrop-blur-md"
        >
          <button>close</button>
        </form>
      </dialog>

      {/* --- SWAP SIDEBAR --- */}
      {swapping && (
        <SwapSidebar
          cardToSwap={swapping}
          deckWishlist={deckWishlist}
          recInput={{
            commander: commander ?? null,
            partner: partner ?? null,
            entries,
            colorIdentity,
            strategyObjectives,
            objectives,
          }}
          deckCards={[
            ...(commander ? [commander] : []),
            ...(partner ? [partner] : []),
            ...entries.map((e) => e.card),
            ...pendingSwaps.map((s) => s.addCard),
          ]}
          checkCard={checkSwapIn}
          format={format}
          showSuggestions={getRules({ format }).hasCommander}
          onConfirm={(replacement) => {
            onAddSwap(swapping.name, swapping.id, replacement);
            setSwapping(null);
          }}
          onClose={() => setSwapping(null)}
          swappedEntries={swappedEntries}
          onSwapEntry={setSwappedEntries}
        />
      )}
    </div>
  );
}
