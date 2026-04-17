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
    <div className="card bg-base-200 border-2 border-primary/30 shadow-xl mb-4 overflow-hidden">
      <div className="card-body p-4 sm:p-5 gap-4">
        {/* Header with Stats count */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="badge badge-primary font-black font-mono">
              {swaps.length}
            </div>
            <h3 className="text-sm font-black uppercase tracking-widest text-base-content/70">
              Pending Swap{swaps.length !== 1 ? "s" : ""}
            </h3>
          </div>

          <button
            onClick={onSaveAsVersion}
            className="btn btn-primary btn-sm px-6 shadow-lg shadow-primary/20 hidden sm:flex"
          >
            Save Changes
          </button>
        </div>

        {/* Swap List */}
        <div className="space-y-2">
          {swaps.map((swap, i) => (
            <div
              key={i}
              className="group flex items-center justify-between bg-base-100 rounded-lg p-3 border border-base-content/5 transition-all hover:border-primary/20"
            >
              <div className="flex items-center gap-2 text-[11px] sm:text-xs font-medium flex-1 overflow-hidden">
                <span className="text-error font-bold whitespace-nowrap bg-error/10 px-1.5 py-0.5 rounded">
                  − {swap.removeCardName}
                </span>
                <span className="opacity-20">→</span>
                <span className="text-success font-bold whitespace-nowrap bg-success/10 px-1.5 py-0.5 rounded">
                  + {swap.addCard.name}
                </span>
              </div>

              <button
                onClick={() => onUndo(swap.removeCardId)}
                className="btn btn-ghost btn-xs text-base-content/40 hover:text-error hover:bg-error/10 no-animation uppercase font-black tracking-tighter ml-4"
              >
                Undo
              </button>
            </div>
          ))}
        </div>

        {/* Mobile-only action button */}
        <button
          onClick={onSaveAsVersion}
          className="btn btn-primary btn-block sm:hidden"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
