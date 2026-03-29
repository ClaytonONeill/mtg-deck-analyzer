// Modules
import { useState } from 'react';

// Types
import type { ScryfallCard } from '@/types';

// Components
import CardSearchPanel from '@/features/deckBuilder/components/CardSearchPanel';

interface SwapSidebarProps {
  cardToSwap: ScryfallCard;
  onConfirm: (replacement: ScryfallCard) => void;
  onClose: () => void;
}

export default function SwapSidebar({
  cardToSwap,
  onConfirm,
  onClose,
}: SwapSidebarProps) {
  const [selected, setSelected] = useState<ScryfallCard | null>(null);

  const handleSelect = (card: ScryfallCard) => {
    setSelected(card);
  };

  const handleConfirm = () => {
    if (!selected) return;
    onConfirm(selected);
    setSelected(null);
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
            <p className="text-xs text-slate-500 uppercase tracking-widest">
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

        {/* Search */}
        <div className="flex flex-col gap-4 px-5 py-4 flex-1 overflow-y-auto">
          <CardSearchPanel
            label="Search for replacement"
            placeholder="Search cards..."
            onSelectCard={handleSelect}
          />

          {/* Selected replacement preview */}
          {selected && (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-slate-400 uppercase tracking-widest">
                Selected Replacement
              </p>
              <div className="bg-slate-800 border border-[#1971c2] rounded-xl p-3 flex flex-col gap-2">
                <p className="text-white font-semibold text-sm">
                  {selected.name}
                </p>
                <p className="text-slate-400 text-xs">{selected.type_line}</p>
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
                className="w-full bg-[#1971c2] hover:bg-blue-500 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors"
              >
                Confirm Swap
              </button>
              <button
                onClick={() => setSelected(null)}
                className="w-full text-slate-400 hover:text-white text-sm py-2 transition-colors"
              >
                Clear Selection
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
