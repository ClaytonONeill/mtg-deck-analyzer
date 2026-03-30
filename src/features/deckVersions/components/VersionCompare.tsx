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

  return (
    <div className="flex flex-col gap-6">
      {/* Selectors */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { id: leftId, setId: setLeftId, label: "Left" },
          { id: rightId, setId: setRightId, label: "Right" },
        ].map(({ id, setId, label }) => (
          <div key={label} className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-400 uppercase tracking-widest">
              {label}
            </label>
            <select
              value={id}
              onChange={(e) => setId(e.target.value as CompareTarget)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1971c2] transition-colors"
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

      {/* Chart type + land toggle controls */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-slate-800 p-1 rounded-lg">
          {(["types", "cmc"] as ChartView[]).map((view) => (
            <button
              key={view}
              onClick={() => setChartView(view)}
              className="px-4 py-1.5 rounded-md text-sm font-semibold transition-colors hover:cursor-pointer"
              style={{
                backgroundColor: chartView === view ? "#1971c2" : "transparent",
                color: chartView === view ? "#fff" : "#64748b",
              }}
            >
              {view === "types" ? "Types" : "CMC Curve"}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer select-none">
          <div
            onClick={() => setIncludeLands((v) => !v)}
            className="w-9 h-5 rounded-full transition-colors relative cursor-pointer"
            style={{ backgroundColor: includeLands ? "#1971c2" : "#334155" }}
          >
            <span
              className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200"
              style={{ left: includeLands ? "18px" : "2px" }}
            />
          </div>
          Include Lands
        </label>
      </div>

      {/* Side by side charts */}
      <div className="grid grid-cols-2 gap-6">
        {[
          {
            id: leftId,
            side: "left", // To avoid duplicate key when same deck versions are compared
            typeData: leftTypeData,
            cmcData: leftCMCData,
          },
          {
            id: rightId,
            side: "right", // To avoid duplicate key when same deck versions are compared
            typeData: rightTypeData,
            cmcData: rightCMCData,
          },
        ].map(({ id, side, typeData, cmcData }) => (
          <div
            key={side}
            className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-4"
          >
            <h3 className="text-sm font-semibold text-white truncate">
              {getVersionLabel(deck, id)}
            </h3>
            {chartView === "types" ? (
              <TypesChart data={typeData} />
            ) : (
              <CMCChart data={cmcData} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
