// Modules
import { useState } from "react";

// Types
import type { Deck } from "@/types";

// Utils
import {
  applyVersionToDeck,
  getVersionLabel,
} from "@/features/deckVersions/utils/versionUtils";
import {
  getTypeBreakdown,
  getCMCBreakdown,
} from "@/features/metrics/utils/deckMetrics";

// Components
import TypesChart from "@/features/metrics/components/TypesChart";
import CMCChart from "@/features/metrics/components/CMCChart";

interface VersionCompareProps {
  deck: Deck;
}

type CompareTarget = "main" | string;
type ChartView = "types" | "cmc";

export default function VersionCompare({ deck }: VersionCompareProps) {
  const [leftId, setLeftId] = useState<CompareTarget>("main");
  const [rightId, setRightId] = useState<CompareTarget>(
    (deck.versions ?? [])[0]?.id ?? "main",
  );
  const [chartView, setChartView] = useState<ChartView>("types");
  const [includeLands, setIncludeLands] = useState(true);

  const versions = deck.versions ?? [];

  const resolveDeck = (id: CompareTarget): Deck => {
    if (id === "main") return deck;
    const version = versions.find((v) => v.id === id);
    return version ? applyVersionToDeck(deck, version) : deck;
  };

  const leftDeck = resolveDeck(leftId);
  const rightDeck = resolveDeck(rightId);

  const leftTypeData = getTypeBreakdown(leftDeck, includeLands);
  const rightTypeData = getTypeBreakdown(rightDeck, includeLands);
  const leftCMCData = getCMCBreakdown(leftDeck, includeLands);
  const rightCMCData = getCMCBreakdown(rightDeck, includeLands);

  const options: { value: CompareTarget; label: string }[] = [
    { value: "main", label: `Main — ${deck.name}` },
    ...versions.map((v) => ({ value: v.id, label: v.name })),
  ];

  const getCardDiff = (fromId: CompareTarget, toId: CompareTarget) => {
    if (fromId === toId) return null;

    const fromEntries = resolveDeck(fromId).entries;
    const toEntries = resolveDeck(toId).entries;

    const fromEntryIds = new Set(fromEntries.map((e) => e.card.id));
    const toEntryIds = new Set(toEntries.map((e) => e.card.id));

    const removed = fromEntries.filter((e) => !toEntryIds.has(e.card.id));
    const added = toEntries.filter((e) => !fromEntryIds.has(e.card.id));

    return { removed, added };
  };

  const diff = getCardDiff(leftId, rightId);
  const hasDiff = diff && (diff.removed.length > 0 || diff.added.length > 0);

  return (
    <div className="flex flex-col gap-8">
      {/* Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-base-200 p-4 rounded-2xl border border-base-300">
        {[
          { id: leftId, setId: setLeftId, label: "Comparison Base" },
          { id: rightId, setId: setRightId, label: "Target Version" },
        ].map(({ id, setId, label }) => (
          <div key={label} className="form-control w-full">
            <label className="label">
              <span className="label-text-alt uppercase tracking-widest opacity-60 font-bold">
                {label}
              </span>
            </label>
            <select
              value={id}
              onChange={(e) => setId(e.target.value as CompareTarget)}
              className="select select-bordered select-sm w-full bg-base-100 focus:select-primary"
            >
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {/* Card diff */}
      {hasDiff ? (
        <div className="card bg-base-100 border border-base-300 shadow-sm overflow-hidden">
          <div className="bg-base-300 px-4 py-2 flex items-center justify-between">
            <h4 className="text-[10px] font-bold uppercase tracking-tighter opacity-70">
              Changelog: {getVersionLabel(deck, leftId)} →{" "}
              {getVersionLabel(deck, rightId)}
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-base-300">
            {/* Removed */}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="badge badge-error badge-sm badge-outline">
                  Removed
                </span>
                <span className="text-xs font-mono opacity-50">
                  {diff.removed.length} cards
                </span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {diff.removed.length === 0 ? (
                  <p className="text-xs italic opacity-30">No cards removed</p>
                ) : (
                  diff.removed.map((e) => (
                    <div
                      key={e.card.id}
                      className="flex items-center gap-3 hover:bg-base-200 p-1 rounded transition-colors group"
                    >
                      <div className="avatar">
                        <div className="w-8 rounded">
                          <img
                            src={e.card.image_uris?.small}
                            alt={e.card.name}
                          />
                        </div>
                      </div>
                      <span className="text-xs font-medium group-hover:text-error transition-colors truncate">
                        {e.card.name}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Added */}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="badge badge-success badge-sm badge-outline">
                  Added
                </span>
                <span className="text-xs font-mono opacity-50">
                  {diff.added.length} cards
                </span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {diff.added.length === 0 ? (
                  <p className="text-xs italic opacity-30">No cards added</p>
                ) : (
                  diff.added.map((e) => (
                    <div
                      key={e.card.id}
                      className="flex items-center gap-3 hover:bg-base-200 p-1 rounded transition-colors group"
                    >
                      <div className="avatar">
                        <div className="w-8 rounded">
                          <img
                            src={e.card.image_uris?.small}
                            alt={e.card.name}
                          />
                        </div>
                      </div>
                      <span className="text-xs font-medium group-hover:text-success transition-colors truncate">
                        {e.card.name}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        leftId !== rightId && (
          <div className="alert bg-base-200 border-base-300 text-xs py-2 flex justify-center italic opacity-60">
            Versions are functionally identical.
          </div>
        )
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-base-300 pb-4">
        <div className="join bg-base-200 p-1 rounded-xl shadow-inner">
          {(["types", "cmc"] as ChartView[]).map((view) => (
            <button
              key={view}
              onClick={() => setChartView(view)}
              className={`join-item btn btn-sm border-none shadow-none ${
                chartView === view ? "btn-primary" : "btn-ghost opacity-60"
              }`}
            >
              {view === "types" ? "By Type" : "By CMC"}
            </button>
          ))}
        </div>

        <div className="form-control">
          <label className="label cursor-pointer gap-3 bg-base-200 px-4 py-2 rounded-xl border border-base-300 transition-hover hover:bg-base-300">
            <span className="label-text font-bold text-[10px] uppercase opacity-60">
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
      </div>

      {/* Side by side charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[
          {
            id: leftId,
            side: "left",
            typeData: leftTypeData,
            cmcData: leftCMCData,
          },
          {
            id: rightId,
            side: "right",
            typeData: rightTypeData,
            cmcData: rightCMCData,
          },
        ].map(({ id, side, typeData, cmcData }) => (
          <div
            key={side}
            className="card bg-base-100 border border-base-300 shadow-xl"
          >
            <div className="card-body p-5">
              <h3 className="card-title text-sm font-black opacity-80 mb-4 border-l-4 border-primary pl-3 uppercase tracking-wider">
                {getVersionLabel(deck, id)}
              </h3>
              <div className="h-[250px] w-full">
                {chartView === "types" ? (
                  <TypesChart data={typeData} />
                ) : (
                  <CMCChart data={cmcData} />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
