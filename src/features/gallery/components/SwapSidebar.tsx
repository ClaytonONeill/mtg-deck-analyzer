// Modules
import {
  useState,
  useMemo,
  useEffect,
  type Dispatch,
  type SetStateAction,
} from "react";

// Types
import type { ScryfallCard, CardCategory, WishlistEntry } from "@/types";

// Hooks
import { useObjectives } from "@/hooks/useObjectives";

// Components
import CardSearchPanel from "@/features/deckBuilder/components/CardSearchPanel";
import ManaCost from "@/components/ManaSymbol/ManaCost";
import ObjectivePill from "@/features/objectives/components/ObjectivePill";

interface SwapSidebarProps {
  cardToSwap: ScryfallCard;
  deckWishlist: WishlistEntry[];
  colorIdentity: string[];
  onConfirm: (replacement: ScryfallCard) => void;
  onClose: () => void;
  swappedEntries: ScryfallCard[];
  onSwapEntry: Dispatch<SetStateAction<ScryfallCard[]>>;
}

type SidebarTab = "search" | "wishlist";

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

function inferCategory(typeLine: string): CardCategory {
  const t = typeLine.toLowerCase();
  if (t.includes("creature")) return "Creature";
  if (t.includes("land")) return "Land";
  if (t.includes("instant")) return "Instant";
  if (t.includes("sorcery")) return "Sorcery";
  if (t.includes("enchantment")) return "Enchantment";
  if (t.includes("artifact")) return "Artifact";
  if (t.includes("planeswalker")) return "Planeswalker";
  return "Other";
}

function isLegalForDeck(card: ScryfallCard, colorIdentity: string[]): boolean {
  if (card.color_identity.length === 0) return true;
  return card.color_identity.every((c) => colorIdentity.includes(c));
}

function toggle<T>(arr: T[], val: T): T[] {
  return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];
}

export default function SwapSidebar({
  cardToSwap,
  deckWishlist,
  colorIdentity,
  onConfirm,
  onClose,
  swappedEntries,
  onSwapEntry,
}: SwapSidebarProps) {
  const [selected, setSelected] = useState<ScryfallCard | null>(null);
  const [activeTab, setActiveTab] = useState<SidebarTab>("search");
  const [colorError, setColorError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [typeFilters, setTypeFilters] = useState<CardCategory[]>([]);
  const [objectiveFilters, setObjectiveFilters] = useState<string[]>([]);

  const { objectives } = useObjectives();

  // Prevent page underneath scroll when sidebar is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const activeObjectiveIds = useMemo(() => {
    const ids = new Set<string>();
    deckWishlist.forEach((e) =>
      (e.objectives ?? []).forEach((o) => ids.add(o.id)),
    );
    return ids;
  }, [deckWishlist]);

  const visibleObjectives = useMemo(
    () => objectives.filter((o) => activeObjectiveIds.has(o.id)),
    [objectives, activeObjectiveIds],
  );

  const filtered = useMemo(() => {
    return deckWishlist.filter((entry) => {
      if (typeFilters.length > 0) {
        if (!typeFilters.includes(inferCategory(entry.card.type_line)))
          return false;
      }
      if (objectiveFilters.length > 0) {
        const entryObjectiveIds = (entry.objectives ?? []).map((o) => o.id);
        if (!objectiveFilters.some((id) => entryObjectiveIds.includes(id)))
          return false;
      }
      return true;
    });
  }, [deckWishlist, typeFilters, objectiveFilters]);

  const hasFilters = typeFilters.length > 0 || objectiveFilters.length > 0;
  const filterCount = typeFilters.length + objectiveFilters.length;

  const handleSelect = (card: ScryfallCard) => {
    if (!isLegalForDeck(card, colorIdentity)) {
      setColorError(
        `${card.name} is outside this deck's color identity and cannot be added.`,
      );
      setSelected(null);
      return;
    }
    setColorError(null);
    setSelected(card);
  };

  const handleConfirm = () => {
    if (!selected) return;
    onSwapEntry((prev) => [...prev, selected]);
    onConfirm(selected);
    setSelected(null);
    setColorError(null);
  };

  const isWishlist = activeTab === "wishlist";

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-30 bg-black/40" onClick={onClose} />

      {/* Panel — narrow on search, wide on wishlist (desktop) */}
      <div
        className={`
          fixed top-0 right-0 h-full z-40 bg-slate-900 border-l border-slate-700
          flex flex-col shadow-2xl transition-[width] duration-300 ease-in-out
          w-[87.5vw]
          ${isWishlist ? "md:w-[52rem]" : "md:w-100"}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0">
          <div className="flex flex-col gap-0.5">
            <p className="text-sm text-slate-500 uppercase tracking-widest">
              Swapping out
            </p>
            <p className="text-white font-semibold text-sm">
              {cardToSwap.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 bg-slate-800 m-4 p-1 rounded-lg shrink-0">
          {(["search", "wishlist"] as SidebarTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setSelected(null);
                setColorError(null);
              }}
              className="flex-1 py-1.5 rounded-md text-xs font-semibold transition-colors"
              style={{
                backgroundColor: activeTab === tab ? "#1971c2" : "transparent",
                color: activeTab === tab ? "#fff" : "#64748b",
              }}
            >
              {tab === "search"
                ? "Search"
                : `Wishlist (${deckWishlist.length})`}
            </button>
          ))}
        </div>

        {/* Fixed top controls for wishlist */}
        {activeTab === "wishlist" && (
          <div className="px-5 shrink-0">
            <button
              onClick={handleConfirm}
              disabled={!selected}
              className={`w-full font-semibold text-sm py-2.5 rounded-lg transition-colors mb-4 ${
                selected
                  ? "bg-[#1971c2] hover:bg-blue-500 text-white hover:cursor-pointer"
                  : "bg-slate-800 text-slate-600 cursor-not-allowed"
              }`}
            >
              {selected
                ? `Confirm Swap — ${selected.name}`
                : "Select a card to swap"}
            </button>

            {/* Filter controls */}
            {deckWishlist.length > 0 && (
              <div className="relative self-start mb-4">
                <button
                  onClick={() => setShowFilters((v) => !v)}
                  className="flex items-center gap-1.5 text-xs font-semibold border px-3 py-1.5 rounded-lg transition-colors"
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
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: "#1971c2", color: "#fff" }}
                    >
                      {filterCount}
                    </span>
                  )}
                </button>

                {showFilters && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowFilters(false)}
                    />
                    <div className="absolute top-full left-0 mt-2 z-20 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-4 flex flex-col gap-4 w-64">
                      <div className="flex flex-col gap-2">
                        <p className="text-xs text-slate-500 uppercase tracking-widest">
                          Type
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {CATEGORY_ORDER.map((cat) => (
                            <button
                              key={cat}
                              onClick={() =>
                                setTypeFilters((prev) => toggle(prev, cat))
                              }
                              className="text-xs px-2.5 py-1 rounded-full border transition-all hover:cursor-pointer"
                              style={{
                                borderColor: typeFilters.includes(cat)
                                  ? "#1971c2"
                                  : "#334155",
                                backgroundColor: typeFilters.includes(cat)
                                  ? "#1971c222"
                                  : "transparent",
                                color: typeFilters.includes(cat)
                                  ? "#1971c2"
                                  : "#94a3b8",
                              }}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>

                      {visibleObjectives.length > 0 && (
                        <div className="flex flex-col gap-2">
                          <p className="text-xs text-slate-500 uppercase tracking-widest">
                            Objective
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {visibleObjectives.map((o) => (
                              <button
                                key={o.id}
                                onClick={() =>
                                  setObjectiveFilters((prev) =>
                                    toggle(prev, o.id),
                                  )
                                }
                                className="transition-all rounded-full hover:cursor-pointer"
                                style={{
                                  outline: objectiveFilters.includes(o.id)
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

                      {hasFilters && (
                        <button
                          onClick={() => {
                            setTypeFilters([]);
                            setObjectiveFilters([]);
                            setShowFilters(false);
                          }}
                          className="text-sm text-slate-500 hover:text-white transition-colors self-start hover:cursor-pointer"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {hasFilters && (
              <p className="text-xs text-slate-500 mb-4">
                {filtered.length} of {deckWishlist.length} cards
              </p>
            )}
          </div>
        )}

        {/* Fixed top controls for search */}
        {activeTab === "search" && selected && (
          <div className="px-5 shrink-0">
            <div className="flex flex-col gap-3 mb-4">
              <p className="text-xs text-slate-400 uppercase tracking-widest">
                Selected Replacement
              </p>
              <div className="bg-slate-800 border border-[#1971c2] rounded-xl p-3 flex flex-col gap-2 text-center justify-center">
                <p className="text-white font-semibold text-md">
                  {selected.name}
                </p>
                <p className="text-slate-400 text-sm">{selected.type_line}</p>
                {selected.image_uris?.normal && (
                  <img
                    src={selected.image_uris.normal}
                    alt={selected.name}
                    className="w-3/4 rounded-lg m-auto"
                  />
                )}
              </div>
              <button
                onClick={handleConfirm}
                className="w-full bg-[#1971c2] hover:bg-blue-500 text-white font-semibold text-sm p-1 rounded-lg transition-colors hover:cursor-pointer"
              >
                Confirm Swap
              </button>
              <button
                onClick={() => setSelected(null)}
                className="w-full text-slate-400 hover:text-white text-sm py-2 transition-colors hover:cursor-pointer"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex flex-col gap-4 px-5 pb-4 flex-1 overflow-y-auto min-h-0">
          {/* Color identity error */}
          {colorError && (
            <div className="bg-red-950 border border-red-800 text-red-300 text-xs rounded-lg px-3 py-2.5 flex items-center justify-between gap-2 shrink-0">
              <span>{colorError}</span>
              <button
                onClick={() => setColorError(null)}
                className="text-red-400 hover:text-red-200 shrink-0"
              >
                ✕
              </button>
            </div>
          )}

          {/* Search tab */}
          {activeTab === "search" && (
            <>
              <CardSearchPanel
                label="Search for replacement"
                placeholder="Search cards..."
                onSelectCard={handleSelect}
              />
            </>
          )}

          {/* Wishlist tab */}
          {activeTab === "wishlist" && (
            <>
              {/* Card grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pb-2">
                {filtered.map((entry) => {
                  const legal = isLegalForDeck(entry.card, colorIdentity);
                  const entryObjectives = entry.objectives ?? [];
                  const isSelected = selected?.id === entry.card.id;
                  const isSwapped = swappedEntries.some(
                    (c) => c.id === entry.card.id,
                  );

                  return (
                    <div
                      key={entry.id}
                      className="flex flex-col items-center gap-2 rounded-xl border p-3 transition-all duration-150"
                      style={{
                        borderColor: isSelected
                          ? "#1971c2"
                          : !legal
                            ? "#7f1d1d"
                            : "#334155",
                        backgroundColor: isSelected ? "#1971c211" : "#1e293b",
                        opacity: isSwapped ? 0.4 : legal ? 1 : 0.5,
                      }}
                    >
                      {/* Image */}
                      <div className="w-full flex justify-center">
                        {entry.card.image_uris?.large ? (
                          <img
                            src={entry.card.image_uris.large}
                            alt={entry.card.name}
                            className="w-full max-w-[160px] rounded-lg cursor-zoom-in hover:brightness-110 transition"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpanded(
                                expanded === entry.card.id
                                  ? null
                                  : entry.card.id,
                              );
                            }}
                          />
                        ) : (
                          <div className="w-full max-w-[160px] aspect-[5/7] rounded-lg bg-slate-700 flex items-center justify-center">
                            <span className="text-slate-500 text-xs">
                              No image
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Name */}
                      <p className="text-white text-sm font-semibold text-center leading-snug w-full">
                        {entry.card.name}
                      </p>

                      {/* Type + mana */}
                      <div className="flex flex-col items-center gap-1 w-full">
                        <p className="text-slate-400 text-xs text-center">
                          {entry.card.type_line}
                        </p>
                        {entry.card.cmc > 0 && (
                          <ManaCost cost={entry.card.mana_cost} size={12} />
                        )}
                      </div>

                      {/* Objectives */}
                      {entryObjectives.length > 0 && (
                        <div className="flex flex-wrap gap-1 justify-center w-full">
                          {entryObjectives.map((o) => (
                            <ObjectivePill key={o.id} objective={o} size="sm" />
                          ))}
                        </div>
                      )}

                      {/* Action */}
                      <div className="w-full mt-auto pt-1">
                        {!legal ? (
                          <p className="text-red-400 text-xs text-center">
                            Outside color identity
                          </p>
                        ) : isSwapped ? (
                          <p className="text-slate-400 text-xs text-center">
                            Card currently swapped
                          </p>
                        ) : (
                          <button
                            onClick={() => legal && handleSelect(entry.card)}
                            disabled={!legal}
                            className="w-full text-xs font-semibold border px-3 py-1.5 rounded-lg transition-colors hover:cursor-pointer disabled:opacity-40"
                            style={{
                              borderColor: isSelected ? "#1971c2" : "#334155",
                              color: isSelected ? "#1971c2" : "#94a3b8",
                              backgroundColor: isSelected
                                ? "#1971c222"
                                : "transparent",
                            }}
                          >
                            {isSelected ? "Selected ✓" : "Select"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Expanded overlay */}
      {expanded && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center"
          onClick={() => setExpanded(null)}
        >
          {(() => {
            const entry = deckWishlist.find((e) => e.card.id === expanded);
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
    </>
  );
}
