import {
  useState,
  useMemo,
  useEffect,
  useRef,
  type Dispatch,
  type SetStateAction,
} from 'react';

// Types
import type { ScryfallCard, CardCategory, WishlistEntry } from '@/types';

// Hooks
import { useObjectives } from '@/hooks/useObjectives';

// Components
import CardSearchPanel from '@/features/deckBuilder/components/CardSearchPanel';
import ManaCost from '@/components/ManaSymbol/ManaCost';
import ObjectivePill from '@/features/objectives/components/ObjectivePill';

// Utils
import { isCardLegalForDeck } from '@/store/deckStore';

// Icons
import { X } from 'lucide-react';

interface SwapSidebarProps {
  cardToSwap: ScryfallCard;
  deckWishlist: WishlistEntry[];
  deckEntryIds: Set<string>;
  colorIdentity: string[];
  onConfirm: (replacement: ScryfallCard) => void;
  onClose: () => void;
  swappedEntries: ScryfallCard[];
  onSwapEntry: Dispatch<SetStateAction<ScryfallCard[]>>;
}

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

function toggle<T>(arr: T[], val: T): T[] {
  return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];
}

export default function SwapSidebar({
  cardToSwap,
  deckWishlist,
  deckEntryIds,
  colorIdentity,
  onConfirm,
  onClose,
  swappedEntries,
  onSwapEntry,
}: SwapSidebarProps) {
  const [selected, setSelected] = useState<ScryfallCard | null>(null);
  const [activeTab, setActiveTab] = useState<'search' | 'wishlist'>('search');
  const [colorError, setColorError] = useState<string | null>(null);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [typeFilters, setTypeFilters] = useState<CardCategory[]>([]);
  const [objectiveFilters, setObjectiveFilters] = useState<string[]>([]);
  const [hideSwapped, setHideSwapped] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { objectives } = useObjectives();

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
      if (
        typeFilters.length > 0 &&
        !typeFilters.includes(inferCategory(entry.card.type_line))
      )
        return false;
      if (objectiveFilters.length > 0) {
        const entryObjectiveIds = (entry.objectives ?? []).map((o) => o.id);
        if (!objectiveFilters.some((id) => entryObjectiveIds.includes(id)))
          return false;
      }
      if (hideSwapped && swappedEntries.some((c) => c.id === entry.card.id))
        return false;
      return true;
    });
  }, [
    deckWishlist,
    typeFilters,
    objectiveFilters,
    hideSwapped,
    swappedEntries,
  ]);

  const filterCount =
    typeFilters.length + objectiveFilters.length + (hideSwapped ? 1 : 0);

  const handleSelect = (card: ScryfallCard) => {
    if (!isCardLegalForDeck(colorIdentity, card)) {
      setColorError(`${card.name} is outside this deck's color identity.`);
      setSelected(null);
      return;
    }
    if (deckEntryIds.has(card.id)) {
      setDuplicateError(`${card.name} is already in this deck.`);
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
    onClose();
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setShowBackToTop(scrollTop > 300);
  };

  const scrollToTop = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-60 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Sidebar Panel */}
      <div
        className={`
        fixed top-0 right-0 h-full z-70 bg-base-100 border-l border-base-300
        flex flex-col shadow-2xl transition-all duration-300 ease-in-out
        w-full sm:w-[85vw] ${activeTab === 'wishlist' ? 'lg:w-4xl' : 'lg:w-2xl'}
      `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-base-300 bg-base-200/50">
          <div>
            <h2 className="text-sm font-black uppercase tracking-tighter opacity-40">
              Swapping Out
            </h2>
            <p className="text-lg font-bold truncate max-w-60">
              {cardToSwap.name}
            </p>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="tabs tabs-boxed bg-base-300 m-6 mb-2 gap-1 p-1">
          <button
            className={`tab flex-1 font-bold ${activeTab === 'search' ? 'tab-active bg-primary! text-primary-content!' : ''}`}
            onClick={() => {
              setActiveTab('search');
              setSelected(null);
            }}
          >
            Search
          </button>
          <button
            className={`tab flex-1 font-bold ${activeTab === 'wishlist' ? 'tab-active bg-primary! text-primary-content!' : ''}`}
            onClick={() => {
              setActiveTab('wishlist');
              setSelected(null);
            }}
          >
            Wishlist ({deckWishlist.length})
          </button>
        </div>

        {/* Action Bar */}
        <div className="px-6 py-4 flex flex-col gap-3 border-b border-base-300/50">
          <button
            onClick={handleConfirm}
            disabled={!selected}
            className={`btn btn-block ${selected ? 'btn-primary shadow-lg shadow-primary/20' : 'btn-disabled'}`}
          >
            {selected
              ? `Confirm Swap with ${selected.name}`
              : 'Select a replacement'}
          </button>
        </div>

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-6 pb-20 custom-scrollbar"
          onScroll={handleScroll}
        >
          {colorError && (
            <div className="alert alert-error text-xs font-bold mb-4 shadow-lg py-2 mt-2">
              <button
                onClick={() => setColorError(null)}
                className="btn btn-ghost btn-xs btn-circle"
              >
                <X />
              </button>
              <span>{colorError}</span>
            </div>
          )}
          {duplicateError && (
            <div className="alert alert-info text-xs text-base-content font-bold mb-4 shadow-lg py-2 mt-2">
              <button
                onClick={() => setDuplicateError(null)}
                className="btn btn-ghost btn-xs btn-circle"
              >
                <X />
              </button>
              <span>{duplicateError}</span>
            </div>
          )}

          {activeTab === 'search' ? (
            <div className="space-y-6 py-6">
              <CardSearchPanel
                label="Replacement Name"
                placeholder="Search Scryfall..."
                onSelectCard={handleSelect}
              />

              {selected && (
                <div className="card bg-base-200 border border-primary/30 shadow-xl overflow-hidden animate-in slide-in-from-bottom-4">
                  <figure className="px-10 pt-10">
                    <img
                      src={selected.image_uris?.normal}
                      alt={selected.name}
                      className="rounded-xl shadow-2xl w-1/2 h-1/2"
                    />
                  </figure>
                  <div className="card-body items-center text-center">
                    <h2 className="card-title text-primary">{selected.name}</h2>
                    <p className="text-xs opacity-60 font-bold">
                      {selected.type_line}
                    </p>
                    <div className="card-actions mt-4">
                      <button
                        className="btn btn-ghost btn-sm rounded-full"
                        onClick={() => setSelected(null)}
                      >
                        Clear Selection
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6 py-6">
              {/* Filter Header */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`btn btn-sm btn-outline gap-2 transition-all ${
                      showFilters || filterCount > 0
                        ? 'border-primary text-primary bg-primary/5'
                        : 'border-base-300'
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                    </svg>
                    Filters
                    {filterCount > 0 && (
                      <span className="badge badge-primary badge-sm font-black">
                        {filterCount}
                      </span>
                    )}
                  </button>
                  <span className="text-[10px] font-mono font-bold opacity-40">
                    {filtered.length} Cards Found
                  </span>
                </div>

                {/* Collapsible Filter Content */}
                {showFilters && (
                  <div className="p-4 bg-base-200 rounded-2xl border border-base-300 animate-in slide-in-from-top-2 duration-200 flex flex-col gap-4 space-y-4">
                    {/* Type Filter */}
                    <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-40">
                        Card Type
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {CATEGORY_ORDER.map((cat) => (
                          <button
                            key={cat}
                            onClick={() =>
                              setTypeFilters((prev) => toggle(prev, cat))
                            }
                            className={`btn btn-xs rounded-full ${typeFilters.includes(cat) ? 'btn-primary' : 'btn-ghost bg-base-300'}`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Objective Filter */}
                    {visibleObjectives.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-40">
                          Objectives
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {visibleObjectives.map((o) => (
                            <button
                              key={o.id}
                              onClick={() =>
                                setObjectiveFilters((prev) =>
                                  toggle(prev, o.id),
                                )
                              }
                              className={`transition-all rounded-full p-0.5 ${objectiveFilters.includes(o.id) ? 'ring-2 ring-primary ring-offset-2 ring-offset-base-200' : ''}`}
                            >
                              <ObjectivePill objective={o} size="sm" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="divider my-0 opacity-50"></div>

                    <div className="flex items-center justify-between">
                      <label className="label cursor-pointer justify-start gap-4 p-0">
                        <input
                          type="checkbox"
                          className="toggle toggle-primary toggle-sm"
                          checked={hideSwapped}
                          onChange={() => setHideSwapped(!hideSwapped)}
                        />
                        <span className="label-text font-bold opacity-60 text-sm">
                          Hide Swapped
                        </span>
                      </label>

                      {filterCount > 0 && (
                        <button
                          className="text-[10px] text-error font-black uppercase hover:underline"
                          onClick={() => {
                            setTypeFilters([]);
                            setObjectiveFilters([]);
                            setHideSwapped(false);
                          }}
                        >
                          Clear All
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-4">
                {filtered.map((entry) => {
                  const legal = isCardLegalForDeck(colorIdentity, entry.card);
                  const isSelected = selected?.id === entry.card.id;
                  const isSwapped = swappedEntries.some(
                    (c) => c.id === entry.card.id,
                  );
                  const isInDeck = deckEntryIds.has(entry.card.id);

                  return (
                    <div
                      key={entry.id}
                      onClick={() =>
                        legal &&
                        !isSwapped &&
                        !isInDeck &&
                        handleSelect(entry.card)
                      }
                      className={`
                        relative group flex flex-col gap-3 p-3 rounded-2xl border transition-all cursor-pointer
                        ${isSelected ? 'bg-primary/5 border-primary shadow-inner ring-2 ring-primary' : 'bg-base-200 border-base-300 hover:border-primary/50'}
                        ${isSwapped || !legal ? 'opacity-40 grayscale-[0.5]' : 'opacity-100'}
                        ${isInDeck ? 'ring-1 ring-warning' : ''}
                      `}
                    >
                      <div className="relative aspect-5/7 overflow-hidden rounded-xl shadow-lg">
                        <img
                          src={entry.card.image_uris?.normal}
                          alt={entry.card.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />

                        {isInDeck && !isSwapped && (
                          <div className="absolute inset-0 bg-warning/20 flex flex-col items-center justify-center gap-1">
                            <span className="badge badge-warning font-black text-[9px]">
                              IN DECK
                            </span>
                            <span className="text-[9px] font-bold text-warning-content/80 bg-black/50 rounded-full px-2 py-0.5">
                              Already in your deck
                            </span>
                          </div>
                        )}

                        {isSwapped && (
                          <div className="absolute inset-0 bg-error/20 flex flex-col items-center justify-center gap-1">
                            <span className="badge badge-error font-black text-[9px]">
                              SWAPPED
                            </span>
                            <span className="text-[9px] font-bold text-error-content/80 bg-black/50 rounded-full px-2 py-0.5">
                              Already used in a swap
                            </span>
                          </div>
                        )}

                        {!legal && (
                          <div className="absolute inset-0 bg-error/20 flex flex-col items-center justify-center gap-1">
                            <span className="badge badge-error font-black text-[9px]">
                              ILLEGAL
                            </span>
                            <span className="text-[9px] font-bold text-error-content/80 bg-black/50 rounded-full px-2 py-0.5">
                              Outside color identity
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between items-start gap-2">
                          <p className="text-xs font-bold leading-tight truncate">
                            {entry.card.name}
                          </p>
                          <ManaCost cost={entry.card.mana_cost} size={12} />
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {(entry.objectives ?? []).map((o) => (
                            <ObjectivePill key={o.id} objective={o} size="sm" />
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Back to Top Button */}
        {showBackToTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 btn btn-circle btn-primary shadow-lg hover:shadow-xl transition-all duration-200 animate-in fade-in slide-in-from-bottom-4 z-50"
            aria-label="Back to top"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 15l7-7 7 7"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Expanded Overlay (Legacy Image Zoom) */}
      {expanded && (
        <div
          className="fixed inset-0 z-100 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in zoom-in-95"
          onClick={() => setExpanded(null)}
        >
          {(() => {
            const entry = deckWishlist.find((e) => e.card.id === expanded);
            return (
              entry?.card.image_uris?.large && (
                <img
                  src={entry.card.image_uris.large}
                  alt="Zoomed card"
                  className="max-h-full rounded-3xl shadow-2xl ring-1 ring-white/10"
                />
              )
            );
          })()}
        </div>
      )}
    </>
  );
}
