import type { CardCategory, Objective } from "@/types";
import ObjectivePill from "@/features/objectives/components/ObjectivePill";

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
  cardCategories?: CardCategory[];
  objectives?: Objective[];
  decks?: { id: string; name: string }[];
  cmc?: { min: number | null; max: number | null };
  draft: ActiveFilters;
  onChange: (draft: ActiveFilters) => void;
  onClear: () => void;
  filterCount: number;
}

function toggle<T>(arr: T[], val: T): T[] {
  return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];
}

export default function FilterSection({
  isOpen,
  onToggle,
  colorIdentity,
  cardCategories,
  objectives,
  decks,
  cmc,
  draft,
  onChange,
  onClear,
  filterCount,
}: FilterSectionProps) {
  return (
    <div className="w-full">
      <button
        onClick={() => onToggle(!isOpen)}
        className={`btn btn-sm gap-2 w-full sm:w-auto ${
          filterCount > 0 ? "btn-primary" : "btn-outline opacity-70"
        }`}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
          />
        </svg>
        Filters
        {filterCount > 0 && (
          <div className="badge badge-secondary badge-sm">{filterCount}</div>
        )}
      </button>

      {isOpen && (
        <div className="mt-4 p-6 bg-base-100 border border-base-300 rounded-2xl shadow-inner grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Color Identity */}
          {colorIdentity && (
            <div className="space-y-3">
              <label className="text-[10px] font-black opacity-40 uppercase tracking-widest">
                Color Identity
              </label>
              <div className="flex gap-1.5 flex-wrap">
                {colorIdentity.map((c) => (
                  <button
                    key={c}
                    onClick={() =>
                      onChange({ ...draft, colors: toggle(draft.colors, c) })
                    }
                    className={`btn btn-circle btn-sm font-bold ${
                      draft.colors.includes(c)
                        ? "btn-primary"
                        : "btn-outline opacity-50"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* CMC Range */}
          {cmc && (
            <div className="space-y-3">
              <label className="text-[10px] font-black opacity-40 uppercase tracking-widest">
                Mana Value
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={draft.cmc.min ?? ""}
                  onChange={(e) =>
                    onChange({
                      ...draft,
                      cmc: {
                        ...draft.cmc,
                        min:
                          e.target.value === "" ? null : Number(e.target.value),
                      },
                    })
                  }
                  className="input input-bordered input-sm w-full max-w-[80px]"
                />
                <span className="opacity-30">—</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={draft.cmc.max ?? ""}
                  onChange={(e) =>
                    onChange({
                      ...draft,
                      cmc: {
                        ...draft.cmc,
                        max:
                          e.target.value === "" ? null : Number(e.target.value),
                      },
                    })
                  }
                  className="input input-bordered input-sm w-full max-w-[80px]"
                />
              </div>
            </div>
          )}

          {/* Card Types */}
          {cardCategories && (
            <div className="space-y-3 lg:col-span-1">
              <label className="text-[10px] font-black opacity-40 uppercase tracking-widest">
                Type
              </label>
              <div className="flex flex-wrap gap-1.5">
                {cardCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() =>
                      onChange({ ...draft, types: toggle(draft.types, cat) })
                    }
                    className={`btn btn-sm rounded-full normal-case ${
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
              <label className="text-[10px] font-black opacity-40 uppercase tracking-widest">
                Objectives
              </label>
              <div className="max-h-40 overflow-y-auto space-y-1 bg-base-200/50 p-2 rounded-lg border border-base-300 flex flex-col">
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
              <label className="text-[10px] font-black opacity-40 uppercase tracking-widest">
                In Decks
              </label>
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
                    <span className="text-xs font-semibold opacity-70">
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
              onClick={onClear}
              className="btn btn-ghost btn-sm text-error"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
