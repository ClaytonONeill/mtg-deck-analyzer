// Modules
import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Context
import { ChartSelectionProvider } from "@/features/metrics/context/ChartSelectionContext";

// Components
import TypesChart from "@/features/metrics/components/TypesChart";
import CMCChart from "@/features/metrics/components/CMCChart";
import SelectedCategoryModal from "@/features/metrics/components/SelectedCategoryModal";

// Utils
import {
  getTypeBreakdown,
  getCMCBreakdown,
} from "@/features/metrics/utils/deckMetrics";
import { CATEGORY_ORDER } from "@/utils/sortCards";

// Types
import type { Deck } from "@/types";

type ChartView = "types" | "cmc";

interface CompareChartsProps {
  baseDeck: Deck;
  targetDeck: Deck;
  baseLabel: string;
  targetLabel: string;
}

// Same axis/grid ink as TypesChart/CMCChart, so the compare charts read as
// part of the same family.
const AXIS_TICK = { fill: "#94a3b8", fontSize: 12 };
const GRID_STROKE = "#334155";
// Base is the muted "before", target the theme accent "after". Both are
// theme tokens so the pair stays distinct in every daisyUI theme.
const BASE_FILL = "var(--color-base-content)";
const BASE_OPACITY = 0.35;
const TARGET_FILL = "var(--color-primary)";

interface HeadToHeadRow {
  label: string;
  base: number;
  target: number;
}

const total = (groups: { count: number }[]) =>
  groups.reduce((s, g) => s + g.count, 0);

function typeRows(base: Deck, target: Deck, lands: boolean): HeadToHeadRow[] {
  const a = new Map(getTypeBreakdown(base, lands).map((d) => [d.category, total(d.groups)]));
  const b = new Map(getTypeBreakdown(target, lands).map((d) => [d.category, total(d.groups)]));
  const cats = new Set([...a.keys(), ...b.keys()]);
  return CATEGORY_ORDER.filter((c) => cats.has(c))
    .concat([...cats].filter((c) => !CATEGORY_ORDER.includes(c)))
    .map((c) => ({ label: c, base: a.get(c) ?? 0, target: b.get(c) ?? 0 }));
}

function cmcRows(base: Deck, target: Deck, lands: boolean): HeadToHeadRow[] {
  const a = getCMCBreakdown(base, lands);
  const b = getCMCBreakdown(target, lands);
  const len = Math.max(a.length, b.length);
  return Array.from({ length: len }, (_, i) => ({
    label: String(i),
    base: a[i] ? total(a[i].groups) : 0,
    target: b[i] ? total(b[i].groups) : 0,
  }));
}

export default function CompareCharts({
  baseDeck,
  targetDeck,
  baseLabel,
  targetLabel,
}: CompareChartsProps) {
  const [view, setView] = useState<ChartView>("types");
  const [includeLands, setIncludeLands] = useState(true);

  const rows =
    view === "types"
      ? typeRows(baseDeck, targetDeck, includeLands)
      : cmcRows(baseDeck, targetDeck, includeLands);

  // One y-scale for both breakdown charts, or equal bars would look unequal.
  const yMax = Math.max(1, ...rows.map((r) => Math.max(r.base, r.target)));

  const panels = [
    { key: "base", label: baseLabel, deck: baseDeck, swatch: "bg-base-content/35" },
    { key: "target", label: targetLabel, deck: targetDeck, swatch: "bg-primary" },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="join bg-base-200 p-1 rounded-box" role="group" aria-label="Chart view">
          {(["types", "cmc"] as ChartView[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              aria-pressed={view === v}
              className={`join-item btn btn-sm text-sm border-none shadow-none ${
                view === v ? "btn-primary" : "btn-ghost"
              }`}
            >
              {v === "types" ? "By Type" : "By Mana Value"}
            </button>
          ))}
        </div>
        <label className="label cursor-pointer gap-3">
          <span className="label-text text-sm md:text-base font-bold text-base-content/70">
            Include Lands
          </span>
          <input
            type="checkbox"
            className="toggle toggle-primary toggle-sm"
            checked={includeLands}
            onChange={() => setIncludeLands(!includeLands)}
          />
        </label>
      </div>

      {/* Head-to-head: the direct comparison */}
      <div className="card bg-base-200 border border-base-300 shadow-sm">
        <div className="card-body p-4 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
            <h3 className="text-xs md:text-sm uppercase tracking-widest font-bold text-base-content/60">
              {view === "types" ? "Card types" : "Mana curve"}, head to head
            </h3>
            <Legend panels={panels} />
          </div>
          <HeadToHeadChart
            rows={rows}
            horizontal={view === "types"}
            baseLabel={baseLabel}
            targetLabel={targetLabel}
          />
        </div>
      </div>

      {/* Color breakdown per side, same chart family as the Types/Mana Curve tabs */}
      <div className="flex flex-col gap-6">
        {panels.map(({ key, label, deck, swatch }) => (
          <ChartSelectionProvider key={key} entries={deck.entries}>
            <div className="card bg-base-200 border border-base-300 shadow-sm">
              <div className="card-body p-4 md:p-6">
                <h3 className="flex items-center gap-2 text-xs md:text-sm uppercase tracking-widest font-bold text-base-content/60 mb-2 min-w-0">
                  <span className={`size-3 rounded-sm shrink-0 ${swatch}`} aria-hidden />
                  <span className="truncate">{label}</span>
                  <span className="normal-case tracking-normal font-normal">· by color</span>
                </h3>
                {view === "types" ? (
                  <TypesChart data={getTypeBreakdown(deck, includeLands)} yMax={yMax} />
                ) : (
                  <CMCChart data={getCMCBreakdown(deck, includeLands)} yMax={yMax} />
                )}
              </div>
            </div>
            <SelectedCategoryModal />
          </ChartSelectionProvider>
        ))}
      </div>
    </div>
  );
}

function Legend({ panels }: { panels: { key: string; label: string; swatch: string }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1">
      {panels.map((p) => (
        <li key={p.key} className="flex items-center gap-2 text-sm min-w-0 max-w-full">
          <span className={`size-3 rounded-sm shrink-0 ${p.swatch}`} aria-hidden />
          <span className="truncate">{p.label}</span>
        </li>
      ))}
    </ul>
  );
}

function HeadToHeadChart({
  rows,
  horizontal,
  baseLabel,
  targetLabel,
}: {
  rows: HeadToHeadRow[];
  horizontal: boolean;
  baseLabel: string;
  targetLabel: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center text-sm text-base-content/60">
        No cards to compare.
      </div>
    );
  }

  // Horizontal bars for types keep every category label readable on phones
  // (vertical columns drop labels like "Planeswalker" once space runs out).
  const height = horizontal ? Math.max(200, rows.length * 52 + 40) : 300;

  const tooltip = (
    <Tooltip
      cursor={{ fill: "rgba(255,255,255,0.08)" }}
      content={({ active, payload }) => {
        if (!active || !payload?.length) return null;
        const row = payload[0].payload as HeadToHeadRow;
        const delta = row.target - row.base;
        return (
          <div className="bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm p-2 min-w-40">
            <p className="font-bold mb-1">
              {horizontal ? row.label : `Mana value ${row.label}`}
            </p>
            <p className="flex justify-between gap-4">
              <span className="truncate max-w-40">{baseLabel}</span>
              <span className="font-mono">{row.base}</span>
            </p>
            <p className="flex justify-between gap-4">
              <span className="truncate max-w-40">{targetLabel}</span>
              <span className="font-mono">{row.target}</span>
            </p>
            <p className="flex justify-between gap-4 border-t border-slate-700 mt-1 pt-1">
              <span>Change</span>
              <span className="font-mono">
                {delta === 0 ? "—" : `${delta > 0 ? "+" : "−"}${Math.abs(delta)}`}
              </span>
            </p>
          </div>
        );
      }}
    />
  );

  const bars = [
    <Bar
      key="base"
      dataKey="base"
      name={baseLabel}
      fill={BASE_FILL}
      fillOpacity={BASE_OPACITY}
      radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
      maxBarSize={18}
    />,
    <Bar
      key="target"
      dataKey="target"
      name={targetLabel}
      fill={TARGET_FILL}
      radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
      maxBarSize={18}
    />,
  ];

  return (
    <ResponsiveContainer width="100%" height={height}>
      {horizontal ? (
        <BarChart
          data={rows}
          layout="vertical"
          margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
          barGap={2}
          barCategoryGap="22%"
        >
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} horizontal={false} />
          <XAxis
            type="number"
            allowDecimals={false}
            tick={AXIS_TICK}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={92}
            interval={0}
            tick={AXIS_TICK}
            axisLine={{ stroke: GRID_STROKE }}
            tickLine={false}
          />
          {tooltip}
          {bars}
        </BarChart>
      ) : (
        <BarChart
          data={rows}
          margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
          barGap={2}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
          <XAxis
            dataKey="label"
            interval={0}
            tick={AXIS_TICK}
            axisLine={{ stroke: GRID_STROKE }}
            tickLine={false}
          />
          <YAxis allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false} />
          {tooltip}
          {bars}
        </BarChart>
      )}
    </ResponsiveContainer>
  );
}
