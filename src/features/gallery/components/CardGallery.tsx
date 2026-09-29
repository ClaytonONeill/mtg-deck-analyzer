import { useState, useMemo, useEffect, useRef } from "react";

// Types
import type {
  CardCategory,
  DeckEntry,
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
import { useCardPrices } from "@/hooks/useCardPriceContext";

// Utils
import {
  sortCards,
  CATEGORY_ORDER,
  type CardSortKey,
  type SortDirection,
} from "@/utils/sortCards";
import SwapSidebar from "@/features/gallery/components/SwapSidebar";
import SwapBanner from "@/features/gallery/components/SwapBanner";
import FilterSection from "@/components/FilterSection/FilterSection";
import ThenBySelect from "@/components/ThenBySelect/ThenBySelect";

// Icons
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CardGalleryProps {
  deckId: string;
  colorIdentity: string[];
  commander?: ScryfallCard | null;
  partner?: ScryfallCard | null;
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
  colorIdentity,
  commander,
  partner,
  entries,
  objectives,
  pendingSwaps,
  onAssign,
  onUnassign,
  onAddSwap,
  onSaveAsVersion,
  onUndoSwap,
}: CardGalleryProps) {
  const [sort, setSort] = useState<SortKey>("type");
  const [thenBy, setThenBy] = useState<CardSortKey | null>(null);
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
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
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
  const [filters, setFilters] = useState({
    colors: [] as string[],
    types: [] as CardCategory[],
    objectives: [] as string[],
    cmc: { min: null as number | null, max: null as number | null },
  });

  const { getForDeck } = useWishlist();
  const deckWishlist = getForDeck(deckId);
  const swappedOutIds = new Set(pendingSwaps.map((s) => s.removeCardId));
  const livePrices = useCardPrices();

  // Logic: Filters & Sorting (Type Safe)
  const filteredAndSorted = useMemo(() => {
    const blackList = BASIC_LANDS.map((b) => b.type_line);
    let result = (entries ?? []).filter(
      (e) => !blackList.includes(e.card.type_line ?? ""),
    );

    if (filters.colors.length > 0) {
      result = result.filter((e) => {
        const cids = e.card.color_identity ?? [];
        return (
          cids.some((c) => filters.colors.includes(c)) ||
          (cids.length === 0 && filters.colors.includes("C"))
        );
      });
    }
    if (filters.types.length > 0)
      result = result.filter((e) => filters.types.includes(e.category));
    if (filters.objectives.length > 0)
      result = result.filter((e) =>
        (e.objectiveIds ?? []).some((id) => filters.objectives.includes(id)),
      );
    if (filters.cmc.min !== null)
      result = result.filter((e) => e.card.cmc >= (filters.cmc.min as number));
    if (filters.cmc.max !== null)
      result = result.filter((e) => e.card.cmc <= (filters.cmc.max as number));

    return sortCards(result, sort, thenBy, sortDir, livePrices);
  }, [entries, filters, sort, thenBy, sortDir, livePrices]);

  const selectSort = (key: SortKey) => {
    setSort(key);
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
              {filteredAndSorted.length} / {entries.length}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start gap-3">
        <FilterSection
          isOpen={showFilters}
          onToggle={setShowFilters}
          colorIdentity={colorIdentity}
          cardCategories={CATEGORY_ORDER}
          objectives={objectives}
          draft={{ ...filters, decks: [] }}
          onChange={(f) =>
            setFilters({
              colors: f.colors,
              types: f.types,
              objectives: f.objectives,
              cmc: f.cmc,
            })
          }
          onClear={() =>
            setFilters({
              colors: [],
              types: [],
              objectives: [],
              cmc: { min: null, max: null },
            })
          }
          filterCount={0}
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

      {/* --- GRID (1-3 cols mobile per user setting, up to 4 on desktop) --- */}
      <div
        className={`grid ${MOBILE_GRID_COLS[mobileCols]} sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-8`}
      >
        {filteredAndSorted.map((entry) => {
          const isSwapped = swappedOutIds.has(entry.card.id);
          const pendingReplacement = pendingSwaps.find(
            (s) => s.removeCardId === entry.card.id,
          )?.addCard;
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
                  {pendingReplacement && (
                    <span className="text-success text-xs font-bold italic">
                      → {pendingReplacement.name}
                    </span>
                  )}
                </div>

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
          deckCards={[
            ...(commander ? [commander] : []),
            ...(partner ? [partner] : []),
            ...entries.map((e) => e.card),
            ...pendingSwaps.map((s) => s.addCard),
          ]}
          colorIdentity={colorIdentity}
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
