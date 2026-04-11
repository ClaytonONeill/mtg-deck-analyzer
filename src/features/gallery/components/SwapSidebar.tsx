// Modules
import { useState, useMemo, useEffect } from 'react';

// Types
import type { ScryfallCard, CardCategory } from '@/types';

// Hooks
import { useWishlist } from '@/hooks/useWishlist';
import { useObjectives } from '@/hooks/useObjectives';

// Components
import CardSearchPanel from '@/features/deckBuilder/components/CardSearchPanel';
import ManaCost from '@/components/ManaSymbol/ManaCost';
import ObjectivePill from '@/features/objectives/components/ObjectivePill';

interface SwapSidebarProps {
  cardToSwap: ScryfallCard;
  deckId: string;
  colorIdentity: string[];
  onConfirm: (replacement: ScryfallCard) => void;
  onClose: () => void;
}

type SidebarTab = 'search' | 'wishlist';

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

function inferCategory(typeLine: string): CardCategory {
  const t = typeLine.toLowerCase();
  if (t.includes('creature')) return 'Creature';
  if (t.includes('land')) return 'Land';
  if (t.includes('instant')) return 'Instant';
  if (t.includes('sorcery')) return 'Sorcery';
  if (t.includes('enchantment')) return 'Enchantment';
  if (t.includes('artifact')) return 'Artifact';
  if (t.includes('planeswalker')) return 'Planeswalker';
  return 'Other';
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
  deckId,
  colorIdentity,
  onConfirm,
  onClose,
}: SwapSidebarProps) {
  const [selected, setSelected] = useState<ScryfallCard | null>(null);
  const [activeTab, setActiveTab] = useState<SidebarTab>('search');
  const [colorError, setColorError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [typeFilters, setTypeFilters] = useState<CardCategory[]>([]);
  const [objectiveFilters, setObjectiveFilters] = useState<string[]>([]);

  const { getForDeck } = useWishlist();
  const { objectives } = useObjectives();
  const deckWishlist = getForDeck(deckId);

  // Prevent page underneath scroll when sidebar is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
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
    onConfirm(selected);
    setSelected(null);
    setColorError(null);
  };

  const isWishlist = activeTab === 'wishlist';

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
          ${isWishlist ? 'md:w-[52rem]' : 'md:w-100'}
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
          {(['search', 'wishlist'] as SidebarTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setSelected(null);
                setColorError(null);
              }}
              className="flex-1 py-1.5 rounded-md text-xs font-semibold transition-colors"
              style={{
                backgroundColor: activeTab === tab ? '#1971c2' : 'transparent',
                color: activeTab === tab ? '#fff' : '#64748b',
              }}
            >
              {tab === 'search'
                ? 'Search'
                : `Wishlist (${deckWishlist.length})`}
            </button>
          ))}
        </div>

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
          {activeTab === 'search' && (
            <>
              <CardSearchPanel
                label="Search for replacement"
                placeholder="Search cards..."
                onSelectCard={handleSelect}
              />

              {selected && (
                <div className="flex flex-col gap-3">
                  <p className="text-xs text-slate-400 uppercase tracking-widest">
                    Selected Replacement
                  </p>
                  <div className="bg-slate-800 border border-[#1971c2] rounded-xl p-3 flex flex-col gap-2 text-center justify-center">
                    <p className="text-white font-semibold text-md">
                      {selected.name}
                    </p>
                    <p className="text-slate-400 text-sm">
                      {selected.type_line}
                    </p>
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
              )}
            </>
          )}

          {/* Wishlist tab */}
          {activeTab === 'wishlist' && (
            <>
              {/* Sticky confirm bar */}
              <button
                onClick={handleConfirm}
                disabled={!selected}
                className={`w-full font-semibold text-sm py-2.5 rounded-lg transition-colors mt-2 shrink-0 ${
                  selected
                    ? 'bg-[#1971c2] hover:bg-blue-500 text-white hover:cursor-pointer'
                    : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                }`}
              >
                {selected
                  ? `Confirm Swap — ${selected.name}`
                  : 'Select a card to swap'}
              </button>

              {/* Filter controls */}
              {deckWishlist.length > 0 && (
                <div className="relative self-start shrink-0">
                  <button
                    onClick={() => setShowFilters((v) => !v)}
                    className="flex items-center gap-1.5 text-xs font-semibold border px-3 py-1.5 rounded-lg transition-colors"
                    style={{
                      borderColor: filterCount > 0 ? '#1971c2' : '#334155',
                      color: filterCount > 0 ? '#1971c2' : '#94a3b8',
                      backgroundColor:
                        filterCount > 0 ? '#1971c211' : 'transparent',
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
                                    ? '#1971c2'
                                    : '#334155',
                                  backgroundColor: typeFilters.includes(cat)
                                    ? '#1971c222'
                                    : 'transparent',
                                  color: typeFilters.includes(cat)
                                    ? '#1971c2'
                                    : '#94a3b8',
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
                                      : '2px solid transparent',
                                    outlineOffset: '2px',
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
                <p className="text-xs text-slate-500 shrink-0">
                  {filtered.length} of {deckWishlist.length} cards
                </p>
              )}

              {/* Card grid */}
              <div className="flex-1 overflow-y-auto min-h-0">
                {deckWishlist.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
                    <p className="text-slate-500 text-sm">
                      No wishlist cards for this deck.
                    </p>
                    <p className="text-slate-600 text-xs">
                      Tag cards to this deck from the Wishlist page.
                    </p>
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
                    <p className="text-slate-500 text-sm">
                      No cards match the current filters.
                    </p>
                    <button
                      onClick={() => {
                        setTypeFilters([]);
                        setObjectiveFilters([]);
                      }}
                      className="text-[#1971c2] hover:underline text-sm hover:cursor-pointer"
                    >
                      Clear filters
                    </button>
                  </div>
                ) : (
                  /*
                   * Subgrid approach:
                   * The outer grid defines 3 columns on md+, 1 on mobile.
                   * Each card spans all 4 named row tracks so cells in the
                   * same visual row align across columns:
                   *   [name] [type + mana] [objectives] [image] [action]
                   */
                  <div
                    className="grid grid-cols-1 md:grid-cols-3 gap-3 pb-2"
                    style={{ gridTemplateRows: 'auto' }}
                  >
                    {filtered.map((entry) => {
                      const legal = isLegalForDeck(entry.card, colorIdentity);
                      const entryObjectives = entry.objectives ?? [];
                      const isSelected = selected?.id === entry.card.id;

                      return (
                        <div
                          key={entry.id}
                          className="
                            grid rounded-xl border p-3 gap-y-2
                            transition-all duration-150
                          "
                          style={{
                            gridTemplateRows: 'subgrid',
                            /* 5 named tracks shared across the whole column */
                            gridRow: 'span 5',
                            borderColor: isSelected
                              ? '#1971c2'
                              : !legal
                                ? '#7f1d1d'
                                : '#334155',
                            backgroundColor: isSelected
                              ? '#1971c211'
                              : '#1e293b',
                            opacity: legal ? 1 : 0.5,
                          }}
                        >
                          {/* Row 1 — Name */}
                          <p className="text-white text-sm font-semibold text-center leading-snug">
                            {entry.card.name}
                          </p>

                          {/* Row 2 — Type + mana cost */}
                          <div className="flex flex-col items-center gap-1">
                            <p className="text-slate-400 text-xs text-center">
                              {entry.card.type_line}
                            </p>
                            {entry.card.cmc > 0 && (
                              <ManaCost cost={entry.card.mana_cost} size={12} />
                            )}
                          </div>

                          {/* Row 3 — Objectives (always rendered, empty div keeps alignment) */}
                          <div className="flex items-start content-start flex-wrap gap-1 justify-center min-h-[1.25rem]">
                            {entryObjectives.map((o) => (
                              <ObjectivePill
                                key={o.id}
                                objective={o}
                                size="sm"
                              />
                            ))}
                          </div>

                          {/* Row 4 — Card image */}
                          <div className="flex justify-center">
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

                          {/* Row 5 — Action + note + illegal warning */}
                          <div className="flex flex-col items-center gap-1.5">
                            {!legal ? (
                              <p className="text-red-400 text-xs text-center">
                                Outside color identity
                              </p>
                            ) : (
                              <>
                                <button
                                  className="w-full text-xs font-semibold border border-slate-600 px-3 py-1.5 rounded-lg transition-colors hover:bg-slate-700 hover:cursor-pointer disabled:opacity-40"
                                  style={{
                                    borderColor: isSelected
                                      ? '#1971c2'
                                      : '#334155',
                                    color: isSelected ? '#1971c2' : '#94a3b8',
                                    backgroundColor: isSelected
                                      ? '#1971c222'
                                      : 'transparent',
                                  }}
                                  onClick={() =>
                                    legal && handleSelect(entry.card)
                                  }
                                  disabled={!legal}
                                >
                                  {isSelected ? 'Selected ✓' : 'Select'}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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
