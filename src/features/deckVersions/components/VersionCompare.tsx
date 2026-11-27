// Modules
import { useMemo, useState } from "react";

// Icons
import { ArrowLeftRight, ChartColumn, Repeat2, Table2 } from "lucide-react";

// Hooks
import { useCardPrices } from "@/hooks/useCardPriceContext";

// Utils
import {
  getDeckStats,
  getSwapGroups,
  resolveCompareDeck,
  type CompareTarget,
} from "@/features/deckVersions/utils/compareUtils";

// Components
import CompareSwapList from "./CompareSwapList";
import CompareCharts from "./CompareCharts";
import CompareStats from "./CompareStats";

// Types
import type { Deck, Objective } from "@/types";

interface VersionCompareProps {
  deck: Deck;
  /** Version to default the right-hand ("Target") side to — the version
   * currently active in the gallery/viewer, if any. Falls back to the first
   * saved version when not viewing a specific one. */
  defaultTargetId?: CompareTarget;
  /** The user's objectives, for the per-objective tag counts in Stats. */
  objectives?: Objective[];
}

type CompareView = "swaps" | "charts" | "stats";

/**
 * Compare two sides of a deck (main or any saved version): the card swaps
 * between them, head-to-head charts, and a stats table. Sub-tabs give each
 * of those the full width instead of squeezing them onto one screen.
 */
export default function VersionCompare({
  deck,
  defaultTargetId,
  objectives = [],
}: VersionCompareProps) {
  const versions = deck.versions ?? [];
  const [leftId, setLeftId] = useState<CompareTarget>("main");
  const [rightId, setRightId] = useState<CompareTarget>(
    defaultTargetId && defaultTargetId !== "main"
      ? defaultTargetId
      : (versions[0]?.id ?? "main"),
  );
  const [view, setView] = useState<CompareView>("swaps");
  const livePrices = useCardPrices();

  const label = (id: CompareTarget) =>
    id === "main"
      ? "Main deck"
      : (versions.find((v) => v.id === id)?.name ?? "Unknown");
  const baseLabel = label(leftId);
  const targetLabel = label(rightId);

  const leftDeck = useMemo(() => resolveCompareDeck(deck, leftId), [deck, leftId]);
  const rightDeck = useMemo(() => resolveCompareDeck(deck, rightId), [deck, rightId]);
  const groups = useMemo(
    () => (leftId === rightId ? [] : getSwapGroups(deck, leftId, rightId)),
    [deck, leftId, rightId],
  );
  // Card Role detection runs regexes over every card, so only on change.
  const leftStats = useMemo(() => getDeckStats(leftDeck, livePrices), [leftDeck, livePrices]);
  const rightStats = useMemo(() => getDeckStats(rightDeck, livePrices), [rightDeck, livePrices]);

  const changeCount = groups.reduce((n, g) => n + g.pairs.length, 0);

  const options: { value: CompareTarget; label: string }[] = [
    { value: "main", label: `Main deck — ${deck.name}` },
    ...versions.map((v) => ({ value: v.id, label: v.name })),
  ];

  const selectors = (
    <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-2 md:gap-4 bg-base-200 p-4 rounded-box border border-base-300">
      <CompareSelect
        label="Base"
        swatch="bg-base-content/35"
        value={leftId}
        options={options}
        onChange={setLeftId}
      />
      <button
        type="button"
        onClick={() => {
          setLeftId(rightId);
          setRightId(leftId);
        }}
        className="btn btn-ghost btn-sm md:btn-md btn-square justify-self-center"
        aria-label="Swap base and target"
        title="Swap base and target"
      >
        <ArrowLeftRight size={18} className="rotate-90 md:rotate-0" />
      </button>
      <CompareSelect
        label="Target"
        swatch="bg-primary"
        value={rightId}
        options={options}
        onChange={setRightId}
      />
    </div>
  );

  if (versions.length === 0) {
    return (
      <div className="rounded-box bg-base-200 border border-base-300 p-6 text-center text-sm md:text-base text-base-content/70">
        No saved versions yet. Queue swaps in the Gallery tab and save them as
        a version to compare it with the main deck here.
      </div>
    );
  }

  if (leftId === rightId) {
    return (
      <div className="flex flex-col gap-6">
        {selectors}
        <div className="rounded-box bg-base-200 border border-base-300 p-4 text-center text-sm md:text-base text-base-content/70">
          Pick two different versions to compare.
        </div>
      </div>
    );
  }

  const priceDelta = rightStats.price - leftStats.price;
  const tabs: { key: CompareView; label: string; Icon: typeof Repeat2; count?: number }[] = [
    { key: "swaps", label: "Swaps", Icon: Repeat2, count: changeCount },
    { key: "charts", label: "Charts", Icon: ChartColumn },
    { key: "stats", label: "Stats", Icon: Table2 },
  ];

  return (
    <div className="flex flex-col gap-6">
      {selectors}

      {/* At-a-glance summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryTile label="Cards changed" value={String(changeCount)} />
        <SummaryTile
          label="Price change"
          value={
            Math.abs(priceDelta) < 0.01
              ? "$0"
              : `${priceDelta > 0 ? "+" : "−"}$${Math.abs(priceDelta).toFixed(2)}`
          }
        />
        <SummaryTile
          label="Avg mana value"
          value={rightStats.avgManaValue.toFixed(2)}
          from={leftStats.avgManaValue.toFixed(2)}
        />
        <SummaryTile
          label="Lands"
          value={String(rightStats.lands)}
          from={String(leftStats.lands)}
        />
      </div>

      {/* Sub-tabs */}
      <div role="tablist" aria-label="Compare views" className="tabs tabs-box bg-base-200 p-1">
        {tabs.map(({ key, label: text, Icon, count }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={view === key}
            onClick={() => setView(key)}
            className={`tab flex-1 gap-2 text-sm md:text-base font-bold ${
              view === key ? "tab-active" : "text-base-content/60"
            }`}
          >
            <Icon size={16} aria-hidden />
            {text}
            {count !== undefined && (
              <span className="font-mono text-xs md:text-sm opacity-70">{count}</span>
            )}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {view === "swaps" &&
          (changeCount === 0 ? (
            <div className="rounded-box bg-base-200 border border-base-300 p-4 text-center text-sm md:text-base text-base-content/70">
              These versions have the same cards.
            </div>
          ) : (
            <CompareSwapList groups={groups} baseLabel={baseLabel} targetLabel={targetLabel} />
          ))}
        {view === "charts" && (
          <CompareCharts
            baseDeck={leftDeck}
            targetDeck={rightDeck}
            baseLabel={baseLabel}
            targetLabel={targetLabel}
          />
        )}
        {view === "stats" && (
          <CompareStats
            base={leftStats}
            target={rightStats}
            baseLabel={baseLabel}
            targetLabel={targetLabel}
            objectives={objectives}
          />
        )}
      </div>
    </div>
  );
}

function CompareSelect({
  label,
  swatch,
  value,
  options,
  onChange,
}: {
  label: string;
  swatch: string;
  value: CompareTarget;
  options: { value: CompareTarget; label: string }[];
  onChange: (id: CompareTarget) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5 min-w-0">
      <span className="flex items-center gap-2 text-xs md:text-sm uppercase tracking-widest font-bold text-base-content/60">
        <span className={`size-3 rounded-sm ${swatch}`} aria-hidden />
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="select select-bordered w-full bg-base-100 focus:select-primary"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SummaryTile({ label, value, from }: { label: string; value: string; from?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-box bg-base-200 border border-base-300 p-3 min-w-0">
      <span className="text-xs md:text-sm uppercase tracking-widest font-bold text-base-content/60 truncate">
        {label}
      </span>
      <span className="flex items-baseline gap-2 flex-wrap font-mono">
        {from !== undefined && from !== value && (
          <>
            <span className="text-sm md:text-base text-base-content/60">{from}</span>
            <span className="text-sm text-base-content/60" aria-label="to">→</span>
          </>
        )}
        <span className="text-xl md:text-2xl font-black leading-none">{value}</span>
      </span>
    </div>
  );
}
