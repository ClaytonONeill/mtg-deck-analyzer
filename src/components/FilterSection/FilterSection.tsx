import type { CardCategory, Objective } from "@/types";
import ObjectivePill from "@/features/objectives/components/ObjectivePill";

// 1. Define the interface for the filter state
export interface ActiveFilters {
  colors: string[];
  types: CardCategory[];
  objectives: string[];
  decks: string[]; // Keep as required for consistency, or make optional
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
  draft: ActiveFilters; // Use the interface here
  onChange: (draft: ActiveFilters) => void; // Replace 'any' with ActiveFilters
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
    <div className="flex flex-col gap-3 w-full">
      <button
        onClick={() => onToggle(!isOpen)}
        className="flex items-center gap-1.5 text-sm font-semibold border px-3 py-1.5 rounded-lg transition-colors w-full sm:w-auto"
        style={{
          borderColor: filterCount > 0 ? "#1971c2" : "#334155",
          color: filterCount > 0 ? "#1971c2" : "#94a3b8",
          backgroundColor: filterCount > 0 ? "#1971c211" : "transparent",
        }}
      >
        Filter
        {filterCount > 0 && (
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: "#1971c2", color: "#fff" }}
          >
            {filterCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex flex-col gap-5">
          {/* Color Identity */}
          {colorIdentity && colorIdentity.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-slate-400 uppercase tracking-widest">
                Color Identity
              </p>
              <div className="flex gap-2 flex-wrap">
                {colorIdentity.map((c) => (
                  <button
                    key={c}
                    onClick={() =>
                      onChange({ ...draft, colors: toggle(draft.colors, c) })
                    }
                    className="w-8 h-8 rounded-full text-sm font-bold border-2 transition-all"
                    style={{
                      borderColor: draft.colors.includes(c)
                        ? "#1971c2"
                        : "#334155",
                      backgroundColor: draft.colors.includes(c)
                        ? "#1971c222"
                        : "transparent",
                      color: "#f1f5f9",
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Card Type */}
          {cardCategories && cardCategories.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-slate-400 uppercase tracking-widest">
                Card Type
              </p>
              <div className="flex flex-wrap gap-1.5">
                {cardCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() =>
                      onChange({ ...draft, types: toggle(draft.types, cat) })
                    }
                    className="text-sm px-2.5 py-1 rounded-full border transition-all"
                    style={{
                      borderColor: draft.types.includes(cat)
                        ? "#1971c2"
                        : "#334155",
                      backgroundColor: draft.types.includes(cat)
                        ? "#1971c222"
                        : "transparent",
                      color: draft.types.includes(cat) ? "#1971c2" : "#94a3b8",
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* CMC Range */}
          {cmc && (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-slate-400 uppercase tracking-widest">
                Mana Value (CMC)
              </p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
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
                  className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-[#1971c2] transition-colors"
                />
                <span className="text-slate-500 text-sm">—</span>
                <input
                  type="number"
                  min={0}
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
                  className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-[#1971c2] transition-colors"
                />
              </div>
            </div>
          )}

          {/* Objectives */}
          {objectives && objectives.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-slate-400 uppercase tracking-widest">
                Objectives
              </p>
              <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto border border-slate-700 rounded-lg px-2.5 py-2">
                {objectives.map((o) => {
                  const checked = draft.objectives.includes(o.id);
                  return (
                    <label
                      key={o.id}
                      className="flex items-center gap-2 cursor-pointer"
                      onClick={() =>
                        onChange({
                          ...draft,
                          objectives: toggle(draft.objectives, o.id),
                        })
                      }
                    >
                      <div
                        className="w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all"
                        style={{
                          borderColor: checked ? o.color : "#475569",
                          backgroundColor: checked ? o.color : "transparent",
                        }}
                      >
                        {checked && (
                          <span className="text-white text-[10px] leading-none font-bold">
                            ✓
                          </span>
                        )}
                      </div>
                      <ObjectivePill objective={o} size="sm" />
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Decks */}
          {decks && decks.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-slate-400 uppercase tracking-widest">
                Decks
              </p>
              <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto">
                {decks.map((deck) => {
                  const checked = draft.decks.includes(deck.id);
                  return (
                    <label
                      key={deck.id}
                      className="flex items-center gap-2 cursor-pointer"
                      onClick={() =>
                        onChange({
                          ...draft,
                          decks: toggle(draft.decks, deck.id),
                        })
                      }
                    >
                      <div
                        className="w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all"
                        style={{
                          borderColor: checked ? "#1971c2" : "#475569",
                          backgroundColor: checked ? "#1971c2" : "transparent",
                        }}
                      >
                        {checked && (
                          <span className="text-white text-[10px] leading-none font-bold">
                            ✓
                          </span>
                        )}
                      </div>
                      <span
                        className="text-sm font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: "#1971c222",
                          color: "#1971c2",
                          border: "1px solid #1971c255",
                        }}
                      >
                        {deck.name}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Clear button */}
          {filterCount > 0 && (
            <button
              onClick={onClear}
              className="text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-4 py-2 rounded-lg transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
}
