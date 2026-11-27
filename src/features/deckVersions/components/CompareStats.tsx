// Utils
import { CARD_ROLES } from "@/features/recommendations/utils/deckSignals";
import { CATEGORY_ORDER } from "@/utils/sortCards";
import { usedObjectives, type DeckStats } from "../utils/compareUtils";

// Types
import type { Objective } from "@/types";

interface CompareStatsProps {
  base: DeckStats;
  target: DeckStats;
  baseLabel: string;
  targetLabel: string;
  objectives: Objective[];
}

type Format = "count" | "price" | "decimal" | "percent";

interface Row {
  label: string;
  base: number;
  target: number;
  format?: Format;
}

const COLOR_NAMES: Record<string, string> = {
  W: "White",
  U: "Blue",
  B: "Black",
  R: "Red",
  G: "Green",
};

/** Cents below $100; whole dollars above, so totals fit a phone column. */
function money(n: number): string {
  return n >= 100 ? n.toFixed(0) : n.toFixed(2);
}

function fmt(n: number, format: Format = "count"): string {
  switch (format) {
    case "price":
      return `$${money(n)}`;
    case "decimal":
      return n.toFixed(2);
    case "percent":
      return `${Math.round(n)}%`;
    default:
      return String(n);
  }
}

function fmtDelta(d: number, format: Format = "count"): string | null {
  const shown =
    format === "price" ? money(Math.abs(d))
    : format === "decimal" ? Math.abs(d).toFixed(2)
    : String(Math.round(Math.abs(d)));
  if (Number(shown) === 0) return null;
  const sign = d > 0 ? "+" : "−";
  return format === "price" ? `${sign}$${shown}`
    : format === "percent" ? `${sign}${shown} pts`
    : `${sign}${shown}`;
}

/** Side-by-side numbers for two compare sides, grouped into small tables. */
export default function CompareStats({
  base,
  target,
  baseLabel,
  targetLabel,
  objectives,
}: CompareStatsProps) {
  const pick = (get: (s: DeckStats) => number) => ({ base: get(base), target: get(target) });

  const overview: Row[] = [
    { label: "Cards in the 99", ...pick((s) => s.cards) },
    { label: "Lands", ...pick((s) => s.lands) },
    { label: "Avg mana value (non-land)", ...pick((s) => s.avgManaValue), format: "decimal" },
    { label: "Deck price", ...pick((s) => s.price), format: "price" },
  ];

  const categories = new Set([...Object.keys(base.categories), ...Object.keys(target.categories)]);
  const types: Row[] = CATEGORY_ORDER.filter((c) => categories.has(c)).map((c) => ({
    label: c,
    ...pick((s) => s.categories[c] ?? 0),
  }));

  const roles: Row[] = CARD_ROLES.map((r) => ({
    label: r.name,
    ...pick((s) => s.roles[r.id] ?? 0),
  })).filter((r) => r.base || r.target);

  const colors: Row[] = ["W", "U", "B", "R", "G"]
    .map((c) => ({
      label: COLOR_NAMES[c],
      ...pick((s) => s.colorDemand[c] ?? 0),
      format: "percent" as const,
    }))
    .filter((r) => r.base || r.target);

  const tags: Row[] = usedObjectives(objectives, base, target).map((o) => ({
    label: o.label,
    ...pick((s) => s.objectives[o.id] ?? 0),
  }));

  const sections: { title: string; hint?: string; rows: Row[] }[] = [
    { title: "Overview", rows: overview },
    { title: "Card types", rows: types },
    {
      title: "Card roles",
      hint: "Detected from rules text. A card can fill more than one role.",
      rows: roles,
    },
    { title: "Color demand", hint: "Share of colored mana symbols.", rows: colors },
    { title: "Objective tags", hint: "Cards tagged with each objective.", rows: tags },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 items-start">
      {sections
        .filter((s) => s.rows.length > 0)
        .map((s) => (
          <StatTable key={s.title} {...s} baseLabel={baseLabel} targetLabel={targetLabel} />
        ))}
    </div>
  );
}

function StatTable({
  title,
  hint,
  rows,
  baseLabel,
  targetLabel,
}: {
  title: string;
  hint?: string;
  rows: Row[];
  baseLabel: string;
  targetLabel: string;
}) {
  return (
    <section className="card bg-base-200 border border-base-300 shadow-sm">
      <div className="card-body p-4 md:p-5 gap-2">
        <h3 className="text-xs md:text-sm uppercase tracking-widest font-bold text-base-content/60">
          {title}
        </h3>
        {hint && <p className="text-xs md:text-sm text-base-content/60">{hint}</p>}
        <table className="w-full text-sm md:text-base table-fixed">
          <thead>
            <tr className="text-xs md:text-sm text-base-content/60 border-b border-base-300">
              <th className="text-left font-semibold py-2 pr-2 w-[34%]">
                <span className="sr-only">Metric</span>
              </th>
              <th className="text-right font-semibold py-2 px-1">
                <span className="flex items-center justify-end gap-1.5 min-w-0">
                  <span className="size-2.5 rounded-sm bg-base-content/35 shrink-0" aria-hidden />
                  <span className="truncate" title={baseLabel}>{baseLabel}</span>
                </span>
              </th>
              <th className="text-right font-semibold py-2 px-1">
                <span className="flex items-center justify-end gap-1.5 min-w-0">
                  <span className="size-2.5 rounded-sm bg-primary shrink-0" aria-hidden />
                  <span className="truncate" title={targetLabel}>{targetLabel}</span>
                </span>
              </th>
              <th className="text-right font-semibold py-2 pl-1 w-[24%]">Change</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const delta = fmtDelta(r.target - r.base, r.format);
              return (
                <tr key={r.label} className="border-b border-base-300/60 last:border-0">
                  <th scope="row" className="text-left font-medium py-2 pr-2 break-words">
                    {r.label}
                  </th>
                  <td className="text-right font-mono py-2 px-1">{fmt(r.base, r.format)}</td>
                  <td className="text-right font-mono py-2 px-1">{fmt(r.target, r.format)}</td>
                  <td
                    className={`text-right font-mono py-2 pl-1 whitespace-nowrap ${
                      delta ? "font-bold" : "text-base-content/40"
                    }`}
                  >
                    {delta ?? "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
