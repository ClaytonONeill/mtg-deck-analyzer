import { useState, useMemo } from "react";

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

// Utils
import { BASIC_LANDS } from "@/features/deckBuilder/utils/basicLands";

// Components
import ObjectivePill from "@/features/objectives/components/ObjectivePill";
import SwapSidebar from "@/features/gallery/components/SwapSidebar";
import SwapBanner from "@/features/gallery/components/SwapBanner";
import FilterSection from "@/components/FilterSection/FilterSection";

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
  onUndoSwap: (removeCardId: string) => void;
}

type SortKey = "type" | "color" | "cmc" | "name";
type SortDirection = "asc" | "desc";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "type", label: "Type" },
  { key: "color", label: "Color" },
  { key: "cmc", label: "Mana" },
  { key: "name", label: "Name" },
];

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
  onUndoSwap,
}: CardGalleryProps) {
  const [sort, setSort] = useState<SortKey>("type");
  const [sortDir, setSortDir] = useState<SortDirection>("asc");
  const [expandedCard, setExpandedCard] = useState<ScryfallCard | null>(null);
  const [swapping, setSwapping] = useState<ScryfallCard | null>(null);
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

    const mult = sortDir === "asc" ? 1 : -1;
    return result.sort((a, b) => {
      switch (sort) {
        case "name":
          return mult * a.card.name.localeCompare(b.card.name);
        case "cmc":
          return mult * (a.card.cmc - b.card.cmc);
        case "type":
          return (
            mult *
            (CATEGORY_ORDER.indexOf(a.category) -
              CATEGORY_ORDER.indexOf(b.category))
          );
        default:
          return 0;
      }
    });
  }, [entries, filters, sort, sortDir]);

  return (
    <div className="flex flex-col gap-6">
      <SwapBanner
        swaps={pendingSwaps}
        onSaveAsVersion={onSaveAsVersion}
        onUndo={onUndoSwap}
      />

      {/* --- DASHBOARD STYLE CONTROLS --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-base-200/50 p-4 rounded-2xl border border-base-300 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black text-neutral-content/40 uppercase tracking-widest hidden sm:inline">
            Sort by
          </span>
          <div className="join bg-base-100 border border-base-300 shadow-sm">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setSort(opt.key)}
                className={`join-item btn btn-sm px-4 border-none transition-all ${sort === opt.key ? "btn-primary" : "btn-ghost opacity-60"}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
            className="btn btn-sm btn-circle btn-ghost bg-base-100 border border-base-300 shadow-sm font-bold"
          >
            {sortDir === "asc" ? "↑" : "↓"}
          </button>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-6">
          <div className="flex flex-col items-end">
            <span className="text-xs font-mono font-bold opacity-40 uppercase tracking-tighter">
              Inventory
            </span>
            <span className="text-sm font-bold">
              {filteredAndSorted.length} / {entries.length}
            </span>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn btn-sm px-6 rounded-full transition-all ${showFilters ? "btn-primary" : "btn-outline border-base-300"}`}
          >
            Filters{" "}
            {filters.colors.length + filters.types.length > 0 ? "●" : ""}
          </button>
        </div>
      </div>

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

      {/* --- GRID (1 col mobile, 4 col desktop) --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
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
                <img
                  src={
                    entry.card.image_uris?.large ||
                    entry.card.image_uris?.normal
                  }
                  alt={entry.card.name}
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

              <div className="px-2 space-y-3">
                <div className="flex flex-col">
                  <h3 className="text-base font-bold truncate tracking-tight">
                    {entry.card.name}
                  </h3>
                  {pendingReplacement && (
                    <span className="text-success text-xs font-bold italic">
                      → {pendingReplacement.name}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5 min-h-[32px]">
                  {!isSwapped ? (
                    <div className="flex gap-2 items-center w-full">
                      {unassigned.length > 0 && (
                        <div className="dropdown dropdown-top dropdown-start">
                          <div
                            tabIndex={0}
                            role="button"
                            className="btn btn-ghost btn-md btn-circle bg-base-200 border-none opacity-60 hover:opacity-100 hover:bg-primary hover:text-primary-content"
                          >
                            +
                          </div>
                          <ul
                            tabIndex={0}
                            className="dropdown-content z-[20] menu p-2 shadow-2xl bg-base-200 rounded-box w-56 max-w-[calc(100vw-2rem)] border border-base-300 mb-2"
                          >
                            <li className="menu-title text-[10px] opacity-40 uppercase tracking-widest">
                              Assign Objective
                            </li>
                            {unassigned.map((o) => (
                              <li key={o.id}>
                                <button
                                  onClick={() => onAssign(entry.card.id, o.id)}
                                  className="text-xs py-2"
                                >
                                  {o.label}
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <button
                        onClick={() => setSwapping(entry.card)}
                        className="btn btn-ghost btn-md rounded-full bg-base-200 border-none px-4 opacity-60 hover:opacity-100 hover:bg-amber-500/10 hover:text-amber-500 transition-all"
                      >
                        ⇄ Swap
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => onUndoSwap(entry.card.id)}
                      className="btn btn-error btn-outline btn-md rounded-full px-4"
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
          className="modal-box p-0 bg-transparent shadow-none w-auto max-w-none"
          onClick={(e) => e.stopPropagation()}
        >
          {expandedCard && (
            <img
              src={expandedCard.image_uris?.large}
              alt={expandedCard.name}
              className="max-h-[85vh] w-auto rounded-[3%] shadow-2xl ring-1 ring-white/20 animate-in zoom-in-95 duration-200"
            />
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
          deckEntryIds={new Set(entries.map((e) => e.card.id))}
          colorIdentity={colorIdentity}
          onConfirm={(replacement) => {
            onAddSwap(swapping.name, swapping.id, replacement);
            setSwapping(null);
          }}
          onClose={() => setSwapping(null)}
          swappedEntries={[]}
          onSwapEntry={() => {}}
        />
      )}
    </div>
  );
}
