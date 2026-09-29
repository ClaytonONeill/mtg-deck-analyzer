// Components
import ColorPip from "@/components/ManaSymbol/ColorPip";

// Utils
import { MTG_COLORS } from "../utils/chartColors";

// Types
import type { ColorDemand } from "../utils/deckMetrics";

const COLOR_NAMES: Record<ColorDemand["color"], string> = {
  W: "White",
  U: "Blue",
  B: "Black",
  R: "Red",
  G: "Green",
};

interface ColorDemandGridProps {
  demand: ColorDemand[];
}

// Percentage of colored mana symbols per color, to guide the basic-land split
// in multicolor decks. Sorted by the caller (most-demanded first).
export default function ColorDemandGrid({ demand }: ColorDemandGridProps) {
  if (demand.length === 0) return null;

  return (
    <div className="mt-6 pt-4 border-t border-base-300">
      <h3 className="text-xs uppercase tracking-widest font-bold opacity-50 mb-3">
        Color Demand
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {demand.map(({ color, pips, percent }) => (
          <div
            key={color}
            className="flex flex-col gap-2 rounded-box bg-base-100 border border-base-300 p-3"
          >
            <div className="flex items-center gap-2">
              <ColorPip color={color} size={18} />
              <span className="text-sm font-semibold">{COLOR_NAMES[color]}</span>
            </div>
            <span
              className="text-2xl font-black font-mono leading-none"
              style={{ color: MTG_COLORS[color] }}
            >
              {Math.round(percent)}%
            </span>
            <div className="h-1.5 w-full rounded-full bg-base-300 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${percent}%`, backgroundColor: MTG_COLORS[color] }}
              />
            </div>
            <span className="text-xs text-base-content/60">
              {Number.isInteger(pips) ? pips : pips.toFixed(1)} pips
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
