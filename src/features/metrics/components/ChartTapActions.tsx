// Icons
import { X } from "lucide-react";

interface ChartTapActionsProps {
  inspected: string | null;
  /** Formats the inspected category for display, e.g. "3" -> "CMC 3". */
  formatLabel?: (category: string) => string;
  onView: () => void;
  onClear: () => void;
}

// Touch-only action row under a metrics chart; see useTapToInspect.
export default function ChartTapActions({
  inspected,
  formatLabel = (c) => c,
  onView,
  onClear,
}: ChartTapActionsProps) {
  if (inspected === null) {
    return (
      <p className="text-xs text-base-content/50 text-center mt-2 min-h-8 flex items-center justify-center">
        Tap a bar for its color breakdown.
      </p>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-2 min-h-8">
      <button type="button" onClick={onView} className="btn btn-primary btn-sm">
        View {formatLabel(inspected)} cards
      </button>
      <button
        type="button"
        onClick={onClear}
        aria-label="Clear selection"
        className="btn btn-ghost btn-sm btn-circle"
      >
        <X size={16} />
      </button>
    </div>
  );
}
