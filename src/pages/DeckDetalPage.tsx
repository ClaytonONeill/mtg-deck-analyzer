import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { deckStore, getDeckCardCount } from "@/store/deckStore";
import {
  getTypeBreakdown,
  getCMCBreakdown,
} from "@/features/metrics/utils/deckMetrics";
import TypesChart from "@/features/metrics/components/TypesChart";
import CMCChart from "@/features/metrics/components/CMCChart";

const COLOR_SYMBOLS: Record<string, { bg: string; text: string }> = {
  W: { bg: "bg-yellow-50", text: "text-yellow-900" },
  U: { bg: "bg-blue-600", text: "text-white" },
  B: { bg: "bg-slate-800", text: "text-slate-100" },
  R: { bg: "bg-red-600", text: "text-white" },
  G: { bg: "bg-green-700", text: "text-white" },
};

type Tab = "metrics" | "objectives" | "decks";
type MetricView = "types" | "cmc";

export default function DeckDetailPage() {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const deck = deckId ? deckStore.getById(deckId) : undefined;

  const [activeTab, setActiveTab] = useState<Tab>("metrics");
  const [metricView, setMetricView] = useState<MetricView>("types");
  const [includeLands, setIncludeLands] = useState(true);

  if (!deck) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Deck not found.{" "}
        <button
          onClick={() => navigate("/")}
          className="ml-2 text-[#1971c2] hover:underline"
        >
          Go home
        </button>
      </div>
    );
  }

  const cardCount = getDeckCardCount(deck);
  const typeData = getTypeBreakdown(deck, includeLands);
  const cmcData = getCMCBreakdown(deck, includeLands);

  const tabs: { key: Tab; label: string }[] = [
    { key: "metrics", label: "Metrics" },
    { key: "objectives", label: "Objectives" },
    { key: "decks", label: "Decks" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <button
          onClick={() => navigate("/")}
          className="text-slate-400 hover:text-white text-sm transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={() => navigate(`/build/${deck.id}`)}
          className="text-sm font-semibold text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-4 py-2 rounded-lg transition-colors"
        >
          Edit Deck
        </button>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Deck identity block */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{deck.name}</h1>
              <div className="flex gap-1">
                {deck.colorIdentity.map((c) => {
                  const style = COLOR_SYMBOLS[c];
                  return (
                    <span
                      key={c}
                      className={`${style.bg} ${style.text} text-[11px] font-bold w-6 h-6 rounded-full flex items-center justify-center border border-slate-600`}
                    >
                      {c}
                    </span>
                  );
                })}
              </div>
            </div>
            <p className="text-slate-400 text-sm">
              <span className="text-slate-500">Commander: </span>
              {deck.commander?.name ?? <span className="italic">None set</span>}
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
              <span>
                Created {new Date(deck.createdAt).toLocaleDateString()}
              </span>
              <span>·</span>
              <span>
                Updated {new Date(deck.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Card count */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span
              className="text-3xl font-bold font-mono"
              style={{ color: cardCount === 100 ? "#1971c2" : "#f1f5f9" }}
            >
              {cardCount}
            </span>
            <span className="text-slate-500 text-xs">/ 100 cards</span>
            <div className="w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min((cardCount / 100) * 100, 100)}%`,
                  backgroundColor: "#1971c2",
                }}
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-slate-800 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="pb-3 text-sm font-semibold transition-colors relative"
              style={{ color: activeTab === tab.key ? "#1971c2" : "#64748b" }}
            >
              {tab.label}
              {activeTab === tab.key && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                  style={{ backgroundColor: "#1971c2" }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "metrics" && (
          <div className="flex flex-col gap-8">
            {/* Controls */}
            <div className="flex items-center justify-between">
              {/* Chart switcher */}
              <div className="flex gap-1 bg-slate-800 p-1 rounded-lg">
                {(["types", "cmc"] as MetricView[]).map((view) => (
                  <button
                    key={view}
                    onClick={() => setMetricView(view)}
                    className="px-4 py-1.5 rounded-md text-sm font-semibold transition-colors"
                    style={{
                      backgroundColor:
                        metricView === view ? "#1971c2" : "transparent",
                      color: metricView === view ? "#fff" : "#64748b",
                    }}
                  >
                    {view === "types" ? "Types" : "CMC Curve"}
                  </button>
                ))}
              </div>

              {/* Land toggle */}
              <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer select-none">
                <div
                  onClick={() => setIncludeLands((v) => !v)}
                  className="w-9 h-5 rounded-full transition-colors relative cursor-pointer"
                  style={{
                    backgroundColor: includeLands ? "#1971c2" : "#334155",
                  }}
                >
                  <span
                    className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200"
                    style={{ left: includeLands ? "18px" : "2px" }}
                  />
                </div>
                Include Lands
              </label>
            </div>

            {/* Chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-6">
                {metricView === "types" ? "Card Types" : "Mana Curve"}
              </h2>
              {metricView === "types" ? (
                <TypesChart data={typeData} />
              ) : (
                <CMCChart data={cmcData} />
              )}
            </div>
          </div>
        )}

        {activeTab === "objectives" && (
          <div className="flex items-center justify-center py-24 text-slate-500 text-sm">
            Objectives coming soon.
          </div>
        )}

        {activeTab === "decks" && (
          <div className="flex items-center justify-center py-24 text-slate-500 text-sm">
            Decks tab coming soon.
          </div>
        )}
      </div>
    </div>
  );
}
