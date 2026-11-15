// Types
import type { ReactNode } from "react";
import type { CardCategory, Objective } from "@/types";

// Components
import ManaSymbol from "@/components/ManaSymbol/ManaSymbol";

// Utils
import {
  MV_BUCKETS,
  MV_TOP,
  UNTAGGED,
} from "@/components/FilterSection/filterConstants";

// Icons
import { Filter } from "lucide-react";

export interface ActiveFilters {
  colors: string[];
  types: CardCategory[];
  objectives: string[];
  decks: string[];
  cmc: { min: number | null; max: number | null };
  /** Card Role ids (see CARD_ROLES). Optional: only the gallery uses it. */
  roles?: string[];
  /** Selected mana value buckets (0–7, where 7 means 7+). Gallery only. */
  manaValues?: number[];
}

interface FilterSectionProps {
  isOpen: boolean;
  onToggle: (open: boolean) => void;
  colorIdentity?: string[];
  cardCategories?: CardCategory[];
  objectives?: Objective[];
  /** Adds an "Untagged" option (id `UNTAGGED`) to the objectives list. */
  allowUntagged?: boolean;
  /**
   * Cards per objective id (and `UNTAGGED`). When given, objectives with no
   * cards are hidden and each chip shows its count.
   */
  objectiveCounts?: Record<string, number>;
  /** Card Roles present in the cards being filtered, with counts. */
  roles?: { id: string; name: string; count: number }[];
  decks?: { id: string; name: string }[];
  /** Shows the mana value toggles (driven by `draft.manaValues`). */
  showManaValue?: boolean;
  draft: ActiveFilters;
  onChange: (draft: ActiveFilters) => void;
  onClear: () => void;
  filterCount: number;
}

/**
 * A toggleable filter chip. `color` (an objective's hex color) tints it the
 * same way ObjectivePill does; without one it uses theme tokens.
 */
function Chip({
  on,
  color,
  count,
  onClick,
  children,
}: {
  on: boolean;
  color?: string;
  count?: number;
  onClick: () => void;
  children: ReactNode;
}) {
  const style = color
    ? on
      ? { backgroundColor: color, borderColor: color, color: "#fff" }
      : { backgroundColor: `${color}1f`, borderColor: `${color}55`, color }
    : undefined;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      style={style}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold transition-all ${
        color
          ? on
            ? "shadow-sm"
            : "hover:brightness-125"
          : on
            ? "bg-primary text-primary-content border-primary"
            : "bg-base-200 border-base-300 text-base-content/80 hover:border-primary/50"
      }`}
    >
      {children}
      {count !== undefined && (
        <span className="font-mono text-xs md:text-sm opacity-70">{count}</span>
      )}
    </button>
  );
}

function toggle<T>(arr: T[], val: T): T[] {
  return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];
}

const LABEL = "text-xs md:text-sm font-black opacity-50 uppercase tracking-widest";

export default function FilterSection({
  isOpen,
  onToggle,
  colorIdentity,
  cardCategories,
  objectives,
  allowUntagged,
  objectiveCounts,
  roles,
  decks,
  showManaValue,
  draft,
  onChange,
  onClear,
  filterCount,
}: FilterSectionProps) {
  const manaValues = draft.manaValues ?? [];

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
                {draft.colors.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onChange({ ...draft, colors: [] })}
                    className="link link-hover text-xs md:text-sm opacity-70"
                  >
                    Clear
                  </button>
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
          {showManaValue && (
            <div className="space-y-3">
              <span className={LABEL}>Mana Value</span>
              <div className="grid grid-cols-8 gap-1" role="group" aria-label="Mana value">
                {MV_BUCKETS.map((b) => {
                  const on = manaValues.includes(b);
                  return (
                    <button
                      key={b}
                      type="button"
                      onClick={() =>
                        onChange({ ...draft, manaValues: toggle(manaValues, b) })
                      }
                      aria-pressed={on}
                      className={`btn btn-sm px-0 text-sm font-mono ${on ? "btn-primary" : "btn-ghost bg-base-200"}`}
                    >
                      {b === MV_TOP ? "7+" : b}
                    </button>
                  );
                })}
              </div>
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

          {/* Card Roles: premade, auto-detected */}
          {roles && roles.length > 0 && (
            <div className="space-y-3 md:col-span-2 lg:col-span-3">
              <div className="flex items-baseline gap-2">
                <span className={LABEL}>Card Roles</span>
                <span className="text-xs md:text-sm opacity-50">
                  detected from card text
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {roles.map((r) => {
                  const on = (draft.roles ?? []).includes(r.id);
                  return (
                    <Chip
                      key={r.id}
                      on={on}
                      count={r.count}
                      onClick={() =>
                        onChange({ ...draft, roles: toggle(draft.roles ?? [], r.id) })
                      }
                    >
                      {r.name}
                    </Chip>
                  );
                })}
              </div>
            </div>
          )}

          {/* Objectives: the user's own strategy tags */}
          {objectives && (
            <div className="space-y-3 md:col-span-2 lg:col-span-3">
              <div className="flex items-baseline gap-2">
                <span className={LABEL}>Objectives</span>
                <span className="text-xs md:text-sm opacity-50">your tags</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {objectives
                  .filter((o) => !objectiveCounts || (objectiveCounts[o.id] ?? 0) > 0)
                  .map((o) => {
                    const on = draft.objectives.includes(o.id);
                    return (
                      <Chip
                        key={o.id}
                        on={on}
                        color={o.color}
                        count={objectiveCounts?.[o.id]}
                        onClick={() =>
                          onChange({ ...draft, objectives: toggle(draft.objectives, o.id) })
                        }
                      >
                        {o.label}
                      </Chip>
                    );
                  })}
                {allowUntagged && (
                  <Chip
                    on={draft.objectives.includes(UNTAGGED)}
                    count={objectiveCounts?.[UNTAGGED]}
                    onClick={() =>
                      onChange({
                        ...draft,
                        objectives: toggle(draft.objectives, UNTAGGED),
                      })
                    }
                  >
                    <span className="italic">Untagged</span>
                  </Chip>
                )}
                {objectiveCounts &&
                  !objectives.some((o) => (objectiveCounts[o.id] ?? 0) > 0) && (
                    <span className="text-sm opacity-50 italic self-center">
                      No cards tagged yet.
                    </span>
                  )}
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
