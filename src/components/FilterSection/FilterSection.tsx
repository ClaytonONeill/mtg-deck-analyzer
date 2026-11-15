// Types
import type { CardCategory, Objective } from "@/types";

// Components
import ObjectivePill from "@/features/objectives/components/ObjectivePill";
import ManaSymbol from "@/components/ManaSymbol/ManaSymbol";

// Utils
import {
  MV_BUCKETS,
  MV_TOP,
  UNTAGGED,
  type ColorMode,
} from "@/components/FilterSection/filterConstants";

// Icons
import { Filter } from "lucide-react";

export interface ActiveFilters {
  colors: string[];
  types: CardCategory[];
  objectives: string[];
  decks: string[];
  cmc: { min: number | null; max: number | null };
}

interface FilterSectionProps {
  isOpen: boolean;
  onToggle: (open: boolean) => void;
  colorIdentity?: string[];
  /** When given, shows an Any/All toggle for the color filter. */
  colorMode?: ColorMode;
  onColorModeChange?: (mode: ColorMode) => void;
  cardCategories?: CardCategory[];
  objectives?: Objective[];
  /** Adds an "Untagged" option (id `UNTAGGED`) to the objectives list. */
  allowUntagged?: boolean;
  decks?: { id: string; name: string }[];
  /** Pass to show the mana value range picker. */
  cmc?: { min: number | null; max: number | null };
  draft: ActiveFilters;
  onChange: (draft: ActiveFilters) => void;
  onClear: () => void;
  filterCount: number;
}

function toggle<T>(arr: T[], val: T): T[] {
  return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];
}

const LABEL = "text-xs md:text-sm font-black opacity-50 uppercase tracking-widest";

/**
 * Mana value range as tappable buckets. Tap one value to filter to it; tap a
 * second to extend to a range; tap a lone selected value (or any value when a
 * range is already set) to start over. "7+" is open-ended.
 */
function nextMvRange(
  current: { min: number | null; max: number | null },
  b: number,
): { min: number | null; max: number | null } {
  const active = current.min !== null || current.max !== null;
  const lo = current.min ?? 0;
  const hi = current.max ?? MV_TOP;
  const single = active && lo === hi;
  const toFilter = (a: number, z: number) => ({
    min: a,
    max: z >= MV_TOP ? null : z,
  });
  if (!active || !single) return toFilter(b, b);
  if (b === lo) return { min: null, max: null };
  return toFilter(Math.min(lo, b), Math.max(lo, b));
}

export default function FilterSection({
  isOpen,
  onToggle,
  colorIdentity,
  colorMode,
  onColorModeChange,
  cardCategories,
  objectives,
  allowUntagged,
  decks,
  cmc,
  draft,
  onChange,
  onClear,
  filterCount,
}: FilterSectionProps) {
  const mvActive = draft.cmc.min !== null || draft.cmc.max !== null;
  const mvLo = draft.cmc.min ?? 0;
  const mvHi = draft.cmc.max ?? MV_TOP;

  return (
    <div className="w-full">
      <button
        onClick={() => onToggle(!isOpen)}
        aria-expanded={isOpen}
        className={`btn btn-sm text-sm gap-2 w-full sm:w-auto ${
          filterCount > 0 ? "btn-primary" : "btn-outline opacity-70"
        }`}
      >
        <Filter size={16} />
        Filters
        {filterCount > 0 && (
          <div className="badge badge-secondary text-xs md:text-sm">{filterCount}</div>
        )}
      </button>

      {isOpen && (
        <div className="mt-4 p-4 md:p-6 bg-base-100 border border-base-300 rounded-2xl shadow-inner grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Color Identity */}
          {colorIdentity && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className={LABEL}>Color Identity</span>
                {colorMode && onColorModeChange && (
                  <div className="join" role="group" aria-label="Color match mode">
                    {(["any", "all"] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => onColorModeChange(m)}
                        aria-pressed={colorMode === m}
                        title={
                          m === "any"
                            ? "Cards with any selected color"
                            : "Cards with every selected color"
                        }
                        className={`join-item btn btn-xs text-xs md:btn-sm md:text-sm capitalize ${colorMode === m ? "btn-primary" : "btn-ghost bg-base-200"}`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                {colorIdentity.map((c) => {
                  const on = draft.colors.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() =>
                        onChange({ ...draft, colors: toggle(draft.colors, c) })
                      }
                      aria-pressed={on}
                      aria-label={c === "C" ? "Colorless" : c}
                      className={`rounded-full p-1 transition-all ${on ? "bg-primary/25 ring-2 ring-primary" : "opacity-40 hover:opacity-90 grayscale-[60%] hover:grayscale-0"}`}
                    >
                      <ManaSymbol symbol={c} size={24} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Mana value */}
          {cmc && (
            <div className="space-y-3">
              <span className={LABEL}>Mana Value</span>
              <div className="grid grid-cols-8 gap-1" role="group" aria-label="Mana value range">
                {MV_BUCKETS.map((b) => {
                  const on = mvActive && b >= mvLo && b <= mvHi;
                  return (
                    <button
                      key={b}
                      type="button"
                      onClick={() =>
                        onChange({ ...draft, cmc: nextMvRange(draft.cmc, b) })
                      }
                      aria-pressed={on}
                      className={`btn btn-sm px-0 text-sm font-mono ${on ? "btn-primary" : "btn-ghost bg-base-200"}`}
                    >
                      {b === MV_TOP ? "7+" : b}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs md:text-sm opacity-50">
                Tap two values for a range.
              </p>
            </div>
          )}

          {/* Card Types */}
          {cardCategories && (
            <div className="space-y-3 lg:col-span-1">
              <span className={LABEL}>Type</span>
              <div className="flex flex-wrap gap-1.5">
                {cardCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() =>
                      onChange({ ...draft, types: toggle(draft.types, cat) })
                    }
                    aria-pressed={draft.types.includes(cat)}
                    className={`btn btn-sm text-sm rounded-full normal-case ${
                      draft.types.includes(cat)
                        ? "btn-primary"
                        : "btn-ghost bg-base-200 opacity-60"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Objectives Checklist */}
          {objectives && (
            <div className="space-y-3">
              <span className={LABEL}>Objectives</span>
              <div className="max-h-40 overflow-y-auto space-y-1 bg-base-200/50 p-2 rounded-lg border border-base-300 flex flex-col">
                {allowUntagged && (
                  <label className="label cursor-pointer justify-start gap-3 py-1 hover:bg-base-300 rounded-md transition-colors px-2">
                    <input
                      type="checkbox"
                      checked={draft.objectives.includes(UNTAGGED)}
                      onChange={() =>
                        onChange({
                          ...draft,
                          objectives: toggle(draft.objectives, UNTAGGED),
                        })
                      }
                      className="checkbox checkbox-xs checkbox-primary"
                    />
                    <span className="text-sm italic opacity-70">Untagged</span>
                  </label>
                )}
                {objectives.map((o) => (
                  <label
                    key={o.id}
                    className="label cursor-pointer justify-start gap-3 py-1 hover:bg-base-300 rounded-md transition-colors px-2"
                  >
                    <input
                      type="checkbox"
                      checked={draft.objectives.includes(o.id)}
                      onChange={() =>
                        onChange({
                          ...draft,
                          objectives: toggle(draft.objectives, o.id),
                        })
                      }
                      className="checkbox checkbox-xs checkbox-primary"
                    />
                    <ObjectivePill objective={o} size="sm" />
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Decks Checklist */}
          {decks && (
            <div className="space-y-3">
              <span className={LABEL}>In Decks</span>
              <div className="max-h-40 overflow-y-auto space-y-1 bg-base-200/50 p-2 rounded-lg border border-base-300">
                {decks.map((deck) => (
                  <label
                    key={deck.id}
                    className="label cursor-pointer justify-start gap-3 py-1 hover:bg-base-300 rounded-md transition-colors px-2"
                  >
                    <input
                      type="checkbox"
                      checked={draft.decks.includes(deck.id)}
                      onChange={() =>
                        onChange({
                          ...draft,
                          decks: toggle(draft.decks, deck.id),
                        })
                      }
                      className="checkbox checkbox-xs checkbox-primary"
                    />
                    <span className="text-xs md:text-sm font-semibold opacity-70">
                      {deck.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="md:col-span-2 lg:col-span-3 pt-4 border-t border-base-300 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClear}
              className="btn btn-ghost btn-sm text-sm text-error"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
