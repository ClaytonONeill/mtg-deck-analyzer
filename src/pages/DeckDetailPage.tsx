// Modules
import { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Layers, BarChart2 } from "lucide-react";

// Stores
import { deckStore, getDeckCardCount } from "@/store/deckStore";

// Hooks
import { useObjectives } from "@/hooks/useObjectives";
import { useGallery } from "@/features/gallery/hooks/useGallery";
import { useDeckVersions } from "@/features/deckVersions/hooks/useDeckVersions";
import { useWishlist } from "@/hooks/useWishlist";
import { useChartSelection } from "@/features/metrics/hooks/useChartSelection";

// Context
import { ChartSelectionProvider } from "@/features/metrics/context/ChartSelectionContext";

// Utils
import {
  getTypeBreakdown,
  getCMCBreakdown,
} from "@/features/metrics/utils/deckMetrics";
import { applyVersionToDeck } from "@/features/deckVersions/utils/versionUtils";

// Components
import TypesChart from "@/features/metrics/components/TypesChart";
import CMCChart from "@/features/metrics/components/CMCChart";
import ColorPip from "@/components/ManaSymbol/ColorPip";
import CardGallery from "@/features/gallery/components/CardGallery";
import VersionCompare from "@/features/deckVersions/components/VersionCompare";
import SaveVersionModal from "@/features/deckVersions/components/SaveVersionModal";
import WishlistDeckFilter from "@/features/wishlist/components/WishlistDeckFilter";
import SelectedCategoryModal from "@/features/metrics/components/SelectedCategoryModal";
import HandSimulator from "@/features/simulator/components/HandSimulator";

// Types
import type { Deck, PendingSwap } from "@/types";

type Tab = "metrics" | "gallery" | "wishlist" | "simulator";
type MetricView = "types" | "cmc" | "compare";
type VersionId = "main" | string;

const EMPTY_DECK: Deck = {
  id: "",
  name: "",
  commander: null,
  partner: null,
  colorIdentity: [],
  entries: [],
  objectives: [],
  versions: [],
  createdAt: "",
  updatedAt: "",
};

function ChartDisplayToggle() {
  const { isStacked, setIsStacked } = useChartSelection();
  return (
    <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 p-1 rounded-lg lg:ml-4 w-fit">
      <button
        onClick={() => setIsStacked(true)}
        className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all hover:cursor-pointer ${
          isStacked
            ? "bg-[#1971c2] text-white shadow-sm"
            : "text-slate-500 hover:text-slate-300"
        }`}
      >
        <Layers size={14} />
        Stacked
      </button>
      <button
        onClick={() => setIsStacked(false)}
        className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all hover:cursor-pointer ${
          !isStacked
            ? "bg-[#1971c2] text-white shadow-sm"
            : "text-slate-500 hover:text-slate-300"
        }`}
      >
        <BarChart2 size={14} />
        Individual
      </button>
    </div>
  );
}

export default function DeckDetailPage() {
  const { deckId } = useParams();
  const navigate = useNavigate();

  const [deck, setDeck] = useState<Deck | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allDecks, setAllDecks] = useState<Deck[]>([]);

  const [activeTab, setActiveTab] = useState<Tab>("metrics");
  const [metricView, setMetricView] = useState<MetricView>("types");
  const [includeLands, setIncludeLands] = useState(true);
  const [activeVersionId, setActiveVersionId] = useState<VersionId>("main");
  const [pendingSwaps, setPendingSwaps] = useState<PendingSwap[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);

  const activeDeck = deck;

  useEffect(() => {
    if (!deckId) return;
    let isMounted = true;
    const fetchDeck = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await deckStore.getById(deckId);
        if (!isMounted) return;
        if (!result) setError("Deck not found");
        else setDeck(result);
      } catch {
        if (isMounted) setError("Failed to load deck");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchDeck();
    return () => {
      isMounted = false;
    };
  }, [deckId]);

  useEffect(() => {
    deckStore.getAll().then(setAllDecks);
  }, []);

  const safeDeck = activeDeck ?? EMPTY_DECK;

  const { objectives } = useObjectives();

  const { assignObjective, unassignObjective } = useGallery(
    safeDeck,
    (updated) => setDeck(updated),
  );

  const {
    versions,
    saveAsVersion,
    deleteVersion,
    appendToVersion,
    assignObjectiveToVersion,
    unassignObjectiveFromVersion,
  } = useDeckVersions(safeDeck, (updated) => setDeck(updated));

  const {
    entries: wishlistEntries,
    removeEntry: removeWishlistEntry,
    tagDeck: tagWishlistDeck,
    untagDeck: untagWishlistDeck,
    assignObjective: assignWishlistObjective,
    unassignObjective: unassignWishlistObjective,
  } = useWishlist();

  const displayDeck = useMemo<Deck>(() => {
    if (!activeDeck) return EMPTY_DECK;
    if (activeVersionId === "main") return activeDeck;
    const version = versions.find((v) => v.id === activeVersionId);
    return version ? applyVersionToDeck(activeDeck, version) : activeDeck;
  }, [activeDeck, activeVersionId, versions]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Loading deck...
      </div>
    );
  }

  if (error || !activeDeck) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        {error ?? "Deck not found."}
        <button
          onClick={() => navigate("/")}
          className="ml-2 text-[#1971c2] hover:underline"
        >
          Go home
        </button>
      </div>
    );
  }

  const cardCount = getDeckCardCount(displayDeck);
  const typeData = getTypeBreakdown(displayDeck, includeLands);
  const cmcData = getCMCBreakdown(displayDeck, includeLands);

  const versionOptions: { value: VersionId; label: string }[] = [
    { value: "main", label: `Main — ${activeDeck.name}` },
    ...versions.map((v) => ({ value: v.id, label: v.name })),
  ];

  const activeVersionLabel =
    versionOptions.find((o) => o.value === activeVersionId)?.label ?? "Main";

  const handleSaveVersion = (name: string, note: string) => {
    saveAsVersion(name, note, pendingSwaps);
    setPendingSwaps([]);
    setShowSaveModal(false);
  };

  const handleUpdateVersion = (versionId: string) => {
    appendToVersion(versionId, pendingSwaps);
    setPendingSwaps([]);
    setShowSaveModal(false);
  };

  const handleAssignObjective = (cardId: string, objectiveId: string) => {
    if (activeVersionId === "main") {
      assignObjective(cardId, objectiveId);
    } else {
      assignObjectiveToVersion(activeVersionId, cardId, objectiveId);
    }
  };

  const handleUnassignObjective = (cardId: string, objectiveId: string) => {
    if (activeVersionId === "main") {
      unassignObjective(cardId, objectiveId);
    } else {
      unassignObjectiveFromVersion(activeVersionId, cardId, objectiveId);
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "metrics", label: "Metrics" },
    { key: "gallery", label: "Gallery" },
    { key: "simulator", label: "Simulator" },
    { key: "wishlist", label: "Deck Wishlist" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="px-6 py-4 flex items-center justify-between">
        <button
          onClick={() => navigate("/")}
          className="text-slate-400 hover:text-white text-sm transition-colors hover:cursor-pointer"
        >
          ← Back
        </button>
        <button
          onClick={() => navigate(`/build/${activeDeck.id}`)}
          className="text-sm font-semibold text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-4 py-2 rounded-lg transition-colors hover:cursor-pointer"
        >
          Edit Deck
        </button>
      </div>

      <div
        className={`mx-auto px-6 py-8 ${activeTab === "simulator" ? "lg:max-w-7/8" : "max-w-5xl"}`}
      >
        {/* Deck identity block */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">
                {activeDeck.name}
              </h1>
              <div className="flex gap-1">
                {activeDeck.colorIdentity.map((c) => (
                  <ColorPip key={c} color={c} size={22} />
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-slate-400 text-sm">
                <span className="text-slate-500">Commander: </span>
                {activeDeck.commander?.name ?? (
                  <span className="italic">None set</span>
                )}
              </p>
              {activeDeck.partner && (
                <p className="text-slate-400 text-sm">
                  <span className="text-slate-500">Partner: </span>
                  {activeDeck.partner.name}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
              <span>
                Created {new Date(activeDeck.createdAt).toLocaleDateString()}
              </span>
              <span>·</span>
              <span>
                Updated {new Date(activeDeck.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>

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
        {/* Version selector */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-8 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3">
          <span className="text-xs text-slate-500 uppercase tracking-widest shrink-0">
            Viewing
          </span>
          <select
            value={activeVersionId}
            onChange={(e) => setActiveVersionId(e.target.value as VersionId)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#1971c2] transition-colors w-full"
          >
            {versionOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {activeVersionId !== "main" && (
            <>
              <button
                onClick={() => {
                  deleteVersion(activeVersionId);
                  setActiveVersionId("main");
                }}
                className="text-xs text-slate-500 hover:text-red-400 transition-colors shrink-0"
              >
                Delete Version
              </button>
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
                style={{
                  backgroundColor: "#1971c222",
                  color: "#1971c2",
                  border: "1px solid #1971c255",
                }}
              >
                {activeVersionLabel}
              </span>
            </>
          )}
        </div>
        {/* Tabs */}
        <div className="flex gap-6 border-b border-slate-800 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="pb-3 text-sm font-semibold transition-colors relative hover:cursor-pointer"
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
        {/* Metrics tab */}
        {activeTab === "metrics" && (
          <ChartSelectionProvider entries={displayDeck.entries}>
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-wrap gap-1 bg-slate-800 p-1 rounded-lg w-fit">
                    {(["types", "cmc", "compare"] as MetricView[]).map(
                      (view) => (
                        <button
                          key={view}
                          onClick={() => setMetricView(view)}
                          className="px-4 py-1.5 rounded-md text-sm font-semibold transition-colors hover:cursor-pointer"
                          style={{
                            backgroundColor:
                              metricView === view ? "#1971c2" : "transparent",
                            color: metricView === view ? "#fff" : "#64748b",
                          }}
                        >
                          {view === "types"
                            ? "Types"
                            : view === "cmc"
                              ? "Mana Curve"
                              : "Compare"}
                        </button>
                      ),
                    )}
                  </div>
                  {metricView !== "compare" && <ChartDisplayToggle />}
                </div>

                {metricView !== "compare" && (
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
                )}
              </div>

              {metricView !== "compare" && (
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
              )}

              {metricView === "compare" && <VersionCompare deck={activeDeck} />}
            </div>
            <SelectedCategoryModal />
          </ChartSelectionProvider>
        )}
        {/* Gallery tab */}
        {activeTab === "gallery" && (
          <CardGallery
            deckId={activeDeck.id}
            colorIdentity={activeDeck.colorIdentity}
            entries={displayDeck.entries.map((e) => ({
              ...e,
              objectiveIds: e.objectiveIds ?? [],
            }))}
            objectives={objectives}
            pendingSwaps={pendingSwaps}
            onAssign={handleAssignObjective}
            onUnassign={handleUnassignObjective}
            onAddSwap={(removeCardName, removeCardId, addCard) =>
              setPendingSwaps((prev) => [
                ...prev,
                { removeCardName, removeCardId, addCard },
              ])
            }
            onSaveAsVersion={() => setShowSaveModal(true)}
            onUndoSwap={(removeCardId) =>
              setPendingSwaps((prev) =>
                prev.filter((s) => s.removeCardId !== removeCardId),
              )
            }
          />
        )}

        {activeTab === "simulator" && (
          <HandSimulator deck={displayDeck} objectives={objectives} />
        )}
        {/* Wishlist tab */}
        {activeTab === "wishlist" && (
          <WishlistDeckFilter
            deckId={activeDeck.id}
            entries={wishlistEntries}
            allDecks={allDecks}
            allObjectives={objectives}
            onRemove={removeWishlistEntry}
            onTagDeck={tagWishlistDeck}
            onUntagDeck={untagWishlistDeck}
            onAssignObjective={assignWishlistObjective}
            onUnassignObjective={unassignWishlistObjective}
          />
        )}
      </div>

      {showSaveModal && (
        <SaveVersionModal
          existingVersions={versions}
          onSave={handleSaveVersion}
          onUpdate={handleUpdateVersion}
          onCancel={() => setShowSaveModal(false)}
        />
      )}
    </div>
  );
}
