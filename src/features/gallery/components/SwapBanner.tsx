// Types
import type { PendingSwap } from "@/types/index";

interface SwapBannerProps {
  swaps: PendingSwap[];
  onSaveAsVersion: () => void;
  onUndo: (removeCardId: string) => void;
}

export default function SwapBanner({
  swaps,
  onSaveAsVersion,
  onUndo,
}: SwapBannerProps) {
  if (swaps.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 bg-slate-800 border border-[#1971c2] rounded-xl px-4 py-3 mb-2">
      <div className="flex flex-col gap-1.5">
        <p className="text-white text-sm font-semibold">
          {swaps.length} pending swap{swaps.length !== 1 ? "s" : ""}
        </p>
        <div className="flex flex-col gap-1.5">
          {swaps.map((swap, i) => (
            <div key={i} className="flex items-center justify-between">
              <p className="text-slate-400 text-xs leading-relaxed flex-1">
                <span className="text-red-400">− {swap.removeCardName}</span>
                <span className="text-slate-600 mx-1">→</span>
                <span className="text-green-400">+ {swap.addCard.name}</span>
              </p>
              <button
                onClick={() => onUndo(swap.removeCardId)}
                className="text-slate-500 hover:text-red-400 text-xs ml-2"
              >
                Undo
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 w-full">
        <button
          onClick={onSaveAsVersion}
          className="flex-1 sm:flex-none bg-[#1971c2] hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          Save as Version
        </button>
      </div>
    </div>
  );
}
