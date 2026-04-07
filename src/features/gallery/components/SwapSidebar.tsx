// Modules
import { useState } from 'react';

// Types
import type { ScryfallCard } from '@/types';

// Hooks
import { useWishlist } from '@/hooks/useWishlist';

// Components
import CardSearchPanel from '@/features/deckBuilder/components/CardSearchPanel';
import ManaCost from '@/components/ManaSymbol/ManaCost';
import ColorPip from '@/components/ManaSymbol/ColorPip';

interface SwapSidebarProps {
  cardToSwap: ScryfallCard;
  deckId: string;
  colorIdentity: string[];
  onConfirm: (replacement: ScryfallCard) => void;
  onClose: () => void;
}

type SidebarTab = 'search' | 'wishlist';

function isLegalForDeck(card: ScryfallCard, colorIdentity: string[]): boolean {
  if (card.color_identity.length === 0) return true;
  return card.color_identity.every((c) => colorIdentity.includes(c));
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

  const { getForDeck } = useWishlist();
  const deckWishlist = getForDeck(deckId);

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

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-30 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-96 z-40 bg-slate-900 border-l border-slate-700 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
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
        <div className="flex flex-col gap-4 px-5 pb-4 flex-1 overflow-y-auto">
          {/* Color identity error */}
          {colorError && (
            <div className="bg-red-950 border border-red-800 text-red-300 text-xs rounded-lg px-3 py-2.5 flex items-center justify-between gap-2">
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
                  <div className="bg-slate-800 border border-[#1971c2] rounded-xl p-3 flex flex-col gap-2">
                    <p className="text-white font-semibold text-sm">
                      {selected.name}
                    </p>
                    <p className="text-slate-400 text-xs">
                      {selected.type_line}
                    </p>
                    {selected.image_uris?.normal && (
                      <img
                        src={selected.image_uris.normal}
                        alt={selected.name}
                        className="w-full rounded-lg mt-1"
                      />
                    )}
                  </div>
                  <button
                    onClick={handleConfirm}
                    className="w-full bg-[#1971c2] hover:bg-blue-500 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors hover:cursor-pointer"
                  >
                    Confirm Swap — {selected.name}
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
            <div className="flex flex-col gap-3">
              <button
                onClick={handleConfirm}
                disabled={!selected}
                className={`w-full font-semibold text-sm py-2.5 rounded-lg transition-colors mt-2 ${
                  selected
                    ? 'bg-[#1971c2] hover:bg-blue-500 text-white hover:cursor-pointer'
                    : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                }`}
              >
                {selected
                  ? `Confirm Swap — ${selected.name}`
                  : 'Select a card to swap'}
              </button>

              {deckWishlist.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
                  <p className="text-slate-500 text-sm">
                    No wishlist cards for this deck.
                  </p>
                  <p className="text-slate-600 text-xs">
                    Tag cards to this deck from the Wishlist page.
                  </p>
                </div>
              ) : (
                deckWishlist.map((entry) => {
                  const legal = isLegalForDeck(entry.card, colorIdentity);
                  return (
                    <button
                      key={entry.id}
                      onClick={() => legal && handleSelect(entry.card)}
                      disabled={!legal}
                      className="flex items-center gap-3 bg-slate-800 border rounded-xl p-3 text-left transition-colors w-full"
                      style={{
                        borderColor:
                          selected?.id === entry.card.id
                            ? '#1971c2'
                            : !legal
                              ? '#7f1d1d'
                              : '#334155',
                        opacity: legal ? 1 : 0.5,
                        cursor: legal ? 'pointer' : 'not-allowed',
                      }}
                    >
                      {entry.card.image_uris?.small && (
                        <img
                          src={entry.card.image_uris.small}
                          alt={entry.card.name}
                          className="w-14 rounded-lg shrink-0"
                        />
                      )}
                      <div className="flex flex-col gap-1 min-w-0">
                        <p className="text-white text-md font-semibold truncate">
                          {entry.card.name}
                        </p>
                        <p className="text-slate-500 text-sm">
                          {entry.card.type_line}
                        </p>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {entry.card.cmc > 0 && (
                            <ManaCost cost={entry.card.mana_cost} size={12} />
                          )}
                          {(entry.card.color_identity ?? []).map((c) => (
                            <ColorPip key={c} color={c} size={12} />
                          ))}
                        </div>
                        {!legal && (
                          <p className="text-red-400 text-xs">
                            Outside color identity
                          </p>
                        )}
                        {entry.note && legal && (
                          <p className="text-slate-500 text-xs italic truncate">
                            {entry.note}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
