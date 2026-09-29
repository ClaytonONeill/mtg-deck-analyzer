// Modules
import { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Layers,
  BarChart2,
  ChevronLeft,
  Edit3,
  Download,
  GitMerge,
} from "lucide-react";

// Stores
import {
  deckStore,
  getDeckCardCount,
  getAllCardIdsInDeck,
  addStrategicObjective,
  removeStrategicObjective,
} from "@/store/deckStore";

// Context
import { CardPriceProvider } from "@/context/CardPriceContext";

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
  getColorDemand,
} from "@/features/metrics/utils/deckMetrics";
import { applyVersionToDeck } from "@/features/deckVersions/utils/versionUtils";

// Components
import TypesChart from "@/features/metrics/components/TypesChart";
import CMCChart from "@/features/metrics/components/CMCChart";
import ColorDemandGrid from "@/features/metrics/components/ColorDemandGrid";
import ColorPip from "@/components/ManaSymbol/ColorPip";
import CardGallery from "@/features/gallery/components/CardGallery";
import VersionCompare from "@/features/deckVersions/components/VersionCompare";
import SaveVersionModal from "@/features/deckVersions/components/SaveVersionModal";
import WishlistDeckFilter from "@/features/wishlist/components/WishlistDeckFilter";
import SelectedCategoryModal from "@/features/metrics/components/SelectedCategoryModal";
import HandSimulator from "@/features/simulator/components/HandSimulator";
import ObjectivePill from "@/features/objectives/components/ObjectivePill";
import ExportDeckModal from "@/features/deckList/components/ExportDeckModal";
import ConfirmDelete from "@/components/ConfirmDelete/ConfirmDelete";
import PageShell from "@/components/PageShell/PageShell";

// Types
import type { Deck, Objective, PendingSwap } from "@/types";

type Tab = "metrics" | "gallery" | "wishlist" | "simulator";
type MetricView = "types" | "cmc" | "compare";
type VersionId = "main" | string;

/** Drives the shared ConfirmDelete dialog for the three distinct, always
 * explicitly-confirmed version actions below — nothing here ever deletes
 * or promotes a version without the user clicking the matching button in
 * one of these dialogs. */
type ConfirmAction =
  | { type: "deleteVersion"; versionId: string; label: string }
  | { type: "setAsMain"; versionId: string; label: string }
  | { type: "deleteMergedVersion"; versionId: string; label: string };

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
  const [showExportModal, setShowExportModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(
    null,
  );

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
    promoteVersionToMain,
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
      <PageShell className="flex flex-col gap-4 items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p className="text-base-content/60 animate-pulse">
          Scanning the multiverse...
        </p>
      </PageShell>
    );
  }

  if (error || !activeDeck) {
    return (
      <PageShell className="flex flex-col items-center justify-center gap-4">
        <p className="text-error font-bold">{error ?? "Deck not found."}</p>
        <button
          onClick={() => navigate("/")}
          className="btn btn-primary btn-outline btn-sm"
        >
          <ChevronLeft size={16} /> Go home
        </button>
      </PageShell>
    );
  }

  const unassignedStrategicObjectives = objectives.filter(
    (o) => !activeDeck.objectives.some((x) => x.id === o.id),
  );

  const cardCount = getDeckCardCount(displayDeck);
  const typeData = getTypeBreakdown(displayDeck, includeLands);
  const cmcData = getCMCBreakdown(displayDeck, includeLands);
  const colorDemand = getColorDemand(displayDeck);

  const versionOptions: { value: VersionId; label: string }[] = [
    { value: "main", label: `Main — ${activeDeck.name}` },
    ...versions.map((v) => ({ value: v.id, label: v.name })),
  ];

  const activeVersionLabel =
    versionOptions.find((o) => o.value === activeVersionId)?.label ?? "Main";

  const handleSaveAsNewVersion = (name: string, note: string) => {
    // Branch off whatever is currently active (main or a version) so the
    // new version reflects everything the user was looking at, not just
    // the newly staged swaps.
    saveAsVersion(
      name,
      note,
      pendingSwaps,
      activeVersionId === "main" ? undefined : activeVersionId,
    );
    setPendingSwaps([]);
    setShowSaveModal(false);
  };

  const handleUpdateActiveVersion = () => {
    if (activeVersionId === "main") return;
    appendToVersion(activeVersionId, pendingSwaps);
    setPendingSwaps([]);
    setShowSaveModal(false);
  };

  const exportVersionLabel =
    activeVersionId === "main" ? "Main Build" : activeVersionLabel;

  const exportTarget: Deck =
    activeVersionId === "main"
      ? displayDeck
      : { ...displayDeck, name: `${displayDeck.name} (${activeVersionLabel})` };

  const handleConfirmAction = () => {
    if (!confirmAction) return;
    switch (confirmAction.type) {
      case "deleteVersion":
        deleteVersion(confirmAction.versionId);
        if (activeVersionId === confirmAction.versionId) {
          setActiveVersionId("main");
        }
        setConfirmAction(null);
        break;
      case "setAsMain":
        promoteVersionToMain(confirmAction.versionId);
        setActiveVersionId("main");
        // Merging and deleting the now-merged version are separate,
        // independently-confirmed actions — chain into a second dialog
        // rather than deleting automatically.
        setConfirmAction({ ...confirmAction, type: "deleteMergedVersion" });
        break;
      case "deleteMergedVersion":
        deleteVersion(confirmAction.versionId);
        setConfirmAction(null);
        break;
    }
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

  const handleAssignStrategicObjective = (objective: Objective) => {
    const updated = addStrategicObjective(activeDeck, objective);
    setDeck(updated);
    void deckStore.save(updated).catch(() => setDeck(activeDeck));
  };

  const handleUnassignStrategicObjective = (objectiveId: string) => {
    const updated = removeStrategicObjective(activeDeck, objectiveId);
    setDeck(updated);
    void deckStore.save(updated).catch(() => setDeck(activeDeck));
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "metrics", label: "Metrics" },
    { key: "gallery", label: "Gallery" },
    { key: "simulator", label: "Simulator" },
    { key: "wishlist", label: "Deck Wishlist" },
  ];

  return (
    <CardPriceProvider cardIds={getAllCardIdsInDeck(activeDeck)}>
      <PageShell>
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

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-sm font-semibold opacity-50">
                  Strategy:
                </span>
                {activeDeck.objectives.map((o) => (
                  <ObjectivePill
                    key={o.id}
                    objective={o}
                    onRemove={() => handleUnassignStrategicObjective(o.id)}
                  />
                ))}
                {unassignedStrategicObjectives.length > 0 && (
                  <div className="dropdown dropdown-bottom dropdown-start">
                    <div
                      tabIndex={0}
                      role="button"
                      className="btn btn-ghost btn-xs btn-circle bg-base-200 border-none opacity-60 hover:opacity-100 hover:bg-primary hover:text-primary-content"
                    >
                      +
                    </div>
                    <ul
                      tabIndex={0}
                      className="dropdown-content z-[20] menu p-2 shadow-2xl bg-base-200 rounded-box w-56 max-w-[calc(100vw-2rem)] border border-base-300 mt-2"
                    >
                      <li className="menu-title text-[10px] opacity-40 uppercase tracking-widest">
                        Set Strategic Objective
                      </li>
                      {activeDeck.objectives.length >= 2 && (
                        <li className="px-2 pb-1">
                          <span className="text-[10px] italic opacity-50">
                            Usually just 1-2 core objectives work best.
                          </span>
                        </li>
                      )}
                      {unassignedStrategicObjectives.map((o) => (
                        <li key={o.id}>
                          <button
                            onClick={() => handleAssignStrategicObjective(o)}
                            className="text-xs py-2"
                          >
                            {o.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {activeDeck.objectives.length === 0 && (
                  <span className="text-xs italic opacity-40">
                    No strategic objective set
                  </span>
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

            <button
              onClick={() => setShowExportModal(true)}
              className="btn btn-sm btn-secondary border-2 border-secondary shadow-md shadow-secondary/30 gap-1.5 font-bold"
            >
              <Download size={16} /> Export
            </button>

            {activeVersionId !== "main" && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    setConfirmAction({
                      type: "setAsMain",
                      versionId: activeVersionId,
                      label: activeVersionLabel,
                    })
                  }
                  className="btn btn-ghost btn-sm gap-1 text-primary hover:bg-primary/10 border border-primary/10"
                >
                  <GitMerge size={14} /> Set as Main
                </button>
                <button
                  onClick={() =>
                    setConfirmAction({
                      type: "deleteVersion",
                      versionId: activeVersionId,
                      label: activeVersionLabel,
                    })
                  }
                  className="btn btn-ghost btn-sm text-error hover:bg-error/10 border border-error  /10"
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
          <div
            role="tablist"
            className="hidden md:flex tabs tabs-bordered mb-8"
          >
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
                    {(["types", "cmc", "compare"] as MetricView[]).map(
                      (view) => (
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
                      ),
                    )}
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
                      <ColorDemandGrid demand={colorDemand} />
                    </div>
                  </div>
                )}

                {metricView === "compare" && (
                  <VersionCompare
                    deck={activeDeck}
                    defaultTargetId={activeVersionId}
                  />
                )}
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
              commander={displayDeck.commander}
              partner={displayDeck.partner}
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
            // Keyed on the version so switching versions restarts the
            // simulator at turn 1 with the newly selected deck list.
            <HandSimulator
              key={activeVersionId}
              deck={displayDeck}
              objectives={objectives}
            />
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
            activeVersionId={activeVersionId}
            activeVersionLabel={activeVersionLabel}
            onSaveAsNew={handleSaveAsNewVersion}
            onUpdateActive={handleUpdateActiveVersion}
            onCancel={() => setShowSaveModal(false)}
          />
        )}

        {showExportModal && (
          <ExportDeckModal
            deck={exportTarget}
            versionLabel={exportVersionLabel}
            onClose={() => setShowExportModal(false)}
          />
        )}

        {confirmAction && (
          <ConfirmDelete
            open
            onClose={() => setConfirmAction(null)}
            onConfirm={handleConfirmAction}
            title={
              confirmAction.type === "setAsMain"
                ? `Set "${confirmAction.label}" as the main build?`
                : `Delete "${confirmAction.label}"?`
            }
            message={
              confirmAction.type === "setAsMain"
                ? "This replaces the current main deck list. This action cannot be undone."
                : confirmAction.type === "deleteMergedVersion"
                  ? "Its saved swaps were computed against the previous main build, so keeping it may show incorrect results if you view, compare, or export it later."
                  : "This action cannot be undone."
            }
            confirmLabel={
              confirmAction.type === "setAsMain"
                ? "Set as Main"
                : "Delete Version"
            }
            cancelLabel={
              confirmAction.type === "deleteMergedVersion"
                ? "Keep Version"
                : "Cancel"
            }
          />
        )}
      </PageShell>
    </CardPriceProvider>
  );
}
