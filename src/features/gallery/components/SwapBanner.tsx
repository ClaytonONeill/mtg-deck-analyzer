// Types
import type { PendingSwap } from '@/types/index';

interface SwapBannerProps {
  swaps: PendingSwap[];
  onSaveAsVersion: () => void;
  onUndo: () => void;
}

export default function SwapBanner({
  swaps,
  onSaveAsVersion,
  onUndo,
}: SwapBannerProps) {
  if (swaps.length === 0) return null;

  return (
    <div className="flex items-center justify-between gap-4 bg-slate-800 border border-[#1971c2] rounded-xl px-5 py-3 mb-2">
      <div className="flex flex-col gap-0.5">
        <p className="text-white text-sm font-semibold">
          {swaps.length} pending swap{swaps.length !== 1 ? 's' : ''}
        </p>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5">
          {swaps.map((swap, i) => (
            <p key={i} className="text-slate-400 text-xs">
              <span className="text-red-400">− {swap.removeCardName}</span>
              <span className="text-slate-600 mx-1">→</span>
              <span className="text-green-400">+ {swap.addCard.name}</span>
            </p>
          ))}
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={onSaveAsVersion}
          className="bg-[#1971c2] hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          Save as Version
        </button>
        <button
          onClick={onUndo}
          className="text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-4 py-2 rounded-lg transition-colors"
        >
          Undo Changes
        </button>
      </div>
    </div>
  );
}
