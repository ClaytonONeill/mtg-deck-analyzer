// Modules
import { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Layers, BarChart2, ChevronLeft, Edit3 } from "lucide-react";

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
    <div className="join lg:ml-4">
      <button
        onClick={() => setIsStacked(true)}
        className={`btn btn-sm join-item ${isStacked ? "btn-primary" : "btn-ghost bg-base-300/50"}`}
      >
        <Layers size={14} />
        Stacked
      </button>
      <button
        onClick={() => setIsStacked(false)}
        className={`btn btn-sm join-item ${!isStacked ? "btn-primary" : "btn-ghost bg-base-300/50"}`}
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
      <div className="min-h-screen bg-base-100 flex flex-col gap-4 items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p className="text-base-content/60 animate-pulse">
          Scanning the multiverse...
        </p>
      </div>
    );
  }

  if (error || !activeDeck) {
    return (
      <div className="min-h-screen bg-base-100 flex flex-col items-center justify-center gap-4">
        <p className="text-error font-bold">{error ?? "Deck not found."}</p>
        <button
          onClick={() => navigate("/")}
          className="btn btn-primary btn-outline btn-sm"
        >
          <ChevronLeft size={16} /> Go home
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
    <div className="min-h-screen bg-base-100 text-base-content">
      <div className="px-6 py-4 flex items-center justify-between border-b border-base-300 bg-base-100/50 backdrop-blur sticky top-0 z-30">
        <button
          onClick={() => navigate("/")}
          className="btn btn-ghost btn-sm text-base-content/70 hover:text-base-content"
        >
          <ChevronLeft size={18} /> Back
        </button>
        <button
          onClick={() => navigate(`/build/${activeDeck.id}`)}
          className="btn btn-sm btn-outline border-base-300"
        >
          <Edit3 size={14} /> Edit Deck
        </button>
      </div>

      <div
        className={`mx-auto px-6 py-8 ${activeTab === "simulator" ? "lg:max-w-6xl" : "max-w-5xl"}`}
      >
        {/* Deck identity block */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-black tracking-tight">
                {activeDeck.name}
              </h1>
              <div className="flex gap-1">
                {activeDeck.colorIdentity.map((c) => (
                  <ColorPip key={c} color={c} size={24} />
                ))}
              </div>
            </div>

            <div className="space-y-1 opacity-80">
              <p className="text-sm">
                <span className="font-semibold opacity-50">Commander:</span>{" "}
                {activeDeck.commander?.name ?? "None set"}
              </p>
              {activeDeck.partner && (
                <p className="text-sm">
                  <span className="font-semibold opacity-50">Partner:</span>{" "}
                  {activeDeck.partner.name}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
            <div className="flex items-baseline gap-1">
              <span
                className={`text-4xl font-mono font-black ${cardCount === 100 ? "text-primary" : "text-base-content"}`}
              >
                {cardCount}
              </span>
              <span className="text-base-content/50 text-sm font-bold">
                / 100 cards
              </span>
            </div>
            {/* Native DaisyUI Progress Bar */}
            <progress
              className={`progress w-48 ${cardCount === 100 ? "progress-primary" : "progress-neutral"}`}
              value={cardCount}
              max="100"
            ></progress>
          </div>
        </div>
        {/* Version selector */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-8 p-4 bg-base-200 border border-base-300 rounded-2xl shadow-inner">
          <label className="text-[10px] uppercase font-black tracking-widest opacity-50 px-2">
            Viewing
          </label>
          <select
            value={activeVersionId}
            onChange={(e) => setActiveVersionId(e.target.value as VersionId)}
            className="select select-bordered select-sm flex-1 sm:max-w-xs bg-base-100"
          >
            {versionOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {activeVersionId !== "main" && (
            <div className="flex items-center gap-3">
              <div className="badge badge-primary badge-outline font-bold py-3">
                {activeVersionLabel}
              </div>
              <button
                onClick={() => {
                  deleteVersion(activeVersionId);
                  setActiveVersionId("main");
                }}
                className="btn btn-ghost btn-xs text-error hover:bg-error/10"
              >
                Delete Version
              </button>
            </div>
          )}
        </div>
        {/* Mobile: scrollable pill nav */}
        <div className="flex md:hidden overflow-x-auto gap-2 mb-8 pb-2 scrollbar-none snap-x snap-mandatory">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`snap-start shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all border ${
                activeTab === tab.key
                  ? "bg-primary text-primary-content border-primary shadow-md shadow-primary/20"
                  : "bg-base-200 border-base-300 text-base-content/50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Desktop: standard bordered tabs */}
        <div role="tablist" className="hidden md:flex tabs tabs-bordered mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              role="tab"
              onClick={() => setActiveTab(tab.key)}
              className={`tab h-12 font-bold transition-all ${
                activeTab === tab.key
                  ? "tab-active border-primary! text-primary"
                  : "text-base-content/50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {/* Metrics tab */}
        {activeTab === "metrics" && (
          <ChartSelectionProvider entries={displayDeck.entries}>
            <div className="flex flex-col gap-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="join bg-base-300/30 p-1">
                  {(["types", "cmc", "compare"] as MetricView[]).map((view) => (
                    <button
                      key={view}
                      onClick={() => setMetricView(view)}
                      className={`btn btn-sm join-item border-none ${metricView === view ? "btn-primary" : "btn-ghost"}`}
                    >
                      {view === "types"
                        ? "Types"
                        : view === "cmc"
                          ? "Mana Curve"
                          : "Compare"}
                    </button>
                  ))}
                </div>

                {metricView !== "compare" && (
                  <div className="flex flex-col items-left md:flex-row md:items-center gap-6">
                    <div className="form-control">
                      <label className="label cursor-pointer gap-3">
                        <span className="label-text font-bold opacity-70">
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
                    <ChartDisplayToggle />
                  </div>
                )}
              </div>

              {metricView !== "compare" && (
                <div className="card bg-base-200 border border-base-300 shadow-sm">
                  <div className="card-body">
                    <h2 className="card-title text-xs uppercase tracking-widest opacity-50 mb-4">
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

              {metricView === "compare" && <VersionCompare deck={activeDeck} />}
            </div>

            {/* Only render the top-level modal when NOT in compare mode —
        compare panels each own their own SelectedCategoryModal */}
            {metricView !== "compare" && <SelectedCategoryModal />}
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
