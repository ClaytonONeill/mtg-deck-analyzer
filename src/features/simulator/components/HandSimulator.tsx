// Modules
import { useState, useCallback, useMemo } from "react";

// Types
import type { Deck, DeckEntry, Objective } from "@/types";

// Components
import ObjectivePill from "@/features/objectives/components/ObjectivePill";

// Utils
import { BASIC_LAND_NAMES, configureBasicLandEndpoint } from "@/utils/utils";

interface HandSimulatorProps {
  deck: Deck;
  objectives: Objective[];
}

interface SimCard {
  id: string;
  entryId: string;
  name: string;
  type_line: string;
  image_uris?: { normal?: string; large?: string };
  objectiveIds: string[];
}

interface SimState {
  drawPile: SimCard[];
  hand: SimCard[];
  discard: SimCard[];
  turn: number;
  awaitingDiscard: boolean;
  selectedCard: SimCard | null;
  objCounts: Record<string, number>;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildCardPool(entries: DeckEntry[]): SimCard[] {
  const cards: SimCard[] = [];
  entries.forEach((entry) => {
    for (let i = 0; i < entry.quantity; i++) {
      cards.push({
        id: `${entry.card.id}-${i}`,
        entryId: entry.card.id,
        name: entry.card.name,
        type_line: entry.card.type_line,
        image_uris: entry.card.image_uris,
        objectiveIds: entry.objectiveIds ?? [],
      });
    }
  });
  return cards;
}

function countObjectives(
  cards: SimCard[],
  existing: Record<string, number>,
): Record<string, number> {
  const updated = { ...existing };
  cards.forEach((card) => {
    card.objectiveIds.forEach((oid) => {
      updated[oid] = (updated[oid] ?? 0) + 1;
    });
  });
  return updated;
}

function initState(entries: DeckEntry[]): SimState {
  const pool = shuffle(buildCardPool(entries));
  const hand = pool.slice(0, 7);
  const drawPile = pool.slice(7);
  return {
    drawPile,
    hand,
    discard: [],
    turn: 1,
    awaitingDiscard: false,
    selectedCard: null,
    objCounts: countObjectives(hand, {}),
  };
}

export default function HandSimulator({
  deck,
  objectives,
}: HandSimulatorProps) {
  const [sim, setSim] = useState<SimState>(() => initState(deck.entries));
  const [autoDiscard, setAutoDiscard] = useState(true);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);

  const [hiddenObjectives, setHiddenObjectives] = useState<Set<string>>(
    () => new Set(),
  );

  const toggleObjective = useCallback((id: string) => {
    setHiddenObjectives((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setSim(initState(deck.entries));
    setHiddenObjectives(new Set());
  }, [deck.entries]);

  const drawCard = useCallback(() => {
    setSim((s) => {
      if (s.drawPile.length === 0 || s.awaitingDiscard) return s;
      const [drawnCard, ...remainingDeck] = s.drawPile;
      if (autoDiscard && s.hand.length >= 7) {
        const lastCardInHand = s.hand[s.hand.length - 1];
        const newHand = [...s.hand.slice(0, -1), drawnCard];
        return {
          ...s,
          drawPile: remainingDeck,
          hand: newHand,
          discard: [...s.discard, lastCardInHand],
          turn: s.turn + 1,
          awaitingDiscard: false,
          selectedCard:
            s.selectedCard?.id === lastCardInHand.id ? null : s.selectedCard,
          objCounts: countObjectives([drawnCard], s.objCounts),
        };
      }
      const newHand = [...s.hand, drawnCard];
      return {
        ...s,
        drawPile: remainingDeck,
        hand: newHand,
        turn: s.turn + 1,
        awaitingDiscard: newHand.length > 7,
        objCounts: countObjectives([drawnCard], s.objCounts),
      };
    });
  }, [autoDiscard]);

  const discardHand = useCallback(() => {
    setSim((s) => {
      if (s.awaitingDiscard || s.hand.length === 0) return s;
      const newHand = s.drawPile.slice(0, 7);
      const newDraw = s.drawPile.slice(7);
      return {
        ...s,
        drawPile: newDraw,
        hand: newHand,
        discard: [...s.discard, ...s.hand],
        turn: s.turn + 1,
        selectedCard: null,
        objCounts: countObjectives(newHand, s.objCounts),
      };
    });
  }, []);

  const discardCard = useCallback((cardId: string) => {
    setSim((s) => {
      const card = s.hand.find((c) => c.id === cardId);
      if (!card) return s;
      return {
        ...s,
        hand: s.hand.filter((c) => c.id !== cardId),
        discard: [...s.discard, card],
        awaitingDiscard: false,
        selectedCard: s.selectedCard?.id === cardId ? null : s.selectedCard,
      };
    });
  }, []);

  const selectCard = useCallback((card: SimCard) => {
    setSim((s) => ({
      ...s,
      selectedCard: s.selectedCard?.id === card.id ? null : card,
    }));
  }, []);

  const maxObjCount = useMemo(
    () => Math.max(1, ...Object.values(sim.objCounts)),
    [sim.objCounts],
  );

  const deckExhausted = sim.drawPile.length === 0 && sim.hand.length === 0;

  const getCardStyle = (
    index: number,
    cardId: string,
    isSelected: boolean,
  ): React.CSSProperties => {
    const isHovered = hoveredCardId === cardId;

    if (isSelected) {
      return {
        transform: `translateY(-36px) scale(1.05)`,
        transformOrigin: "bottom center",
        zIndex: 50,
        transition: "transform 0.2s ease",
      };
    }
    if (isHovered) {
      return {
        transform: `translateY(-24px) scale(1.03)`,
        transformOrigin: "bottom center",
        zIndex: 40,
        transition: "transform 0.15s ease",
      };
    }
    return {
      transform: `translateY(0)`,
      transformOrigin: "bottom center",
      zIndex: index,
      transition: "transform 0.2s ease",
    };
  };

  const ObjectivesPanel = (
    <div className="card bg-base-300 shadow-xl border border-base-100">
      <div className="card-body p-4 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="stats bg-transparent p-0">
            <div className="stat pb-0 pt-0">
              <div className="stat-title text-xs uppercase tracking-widest">
                Current Objectives
              </div>
              <div className="stat-desc text-sm text-info">Turn {sim.turn}</div>
            </div>
          </div>
          <span className="badge badge-ghost badge-sm italic">
            Click to hide
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {objectives.length === 0 ? (
            <div className="alert bg-base-200 col-span-full">
              <span className="text-xs italic">No objectives defined.</span>
            </div>
          ) : Object.keys(sim.objCounts).length === 0 ? (
            <div className="alert alert-info col-span-full py-2">
              <span className="text-xs">
                Draw cards to begin tracking deck objectives.
              </span>
            </div>
          ) : (
            objectives
              .filter((o) => !hiddenObjectives.has(o.id))
              .map((o) => {
                const count = sim.objCounts[o.id] ?? 0;
                const pct = Math.round((count / maxObjCount) * 100);
                return (
                  <div
                    key={o.id}
                    onClick={() => toggleObjective(o.id)}
                    className="flex flex-col gap-2 cursor-pointer group hover:bg-base-100 p-2 rounded-lg transition-colors"
                  >
                    <div className="flex justify-between items-end px-1">
                      <span
                        className="text-xs font-bold truncate pr-2"
                        style={{ color: o.color }}
                      >
                        {o.label}
                      </span>
                      <span className="badge badge-outline font-mono text-[10px]">
                        {count}
                      </span>
                    </div>
                    <progress
                      className="progress w-full transition-all duration-500"
                      value={pct}
                      max="100"
                      style={
                        {
                          "--progress-color": o.color,
                          backgroundColor: "oklch(var(--b1))",
                        } as React.CSSProperties
                      }
                    ></progress>
                  </div>
                );
              })
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Top bar */}
      <div className="flex items-center justify-between bg-base-200 p-4 rounded-2xl shadow-inner">
        <div className="stats bg-transparent">
          <div className="stat pt-0 pb-0">
            <div className="stat-title text-[10px] uppercase">Game Turn</div>
            <div className="stat-value text-2xl text-primary">{sim.turn}</div>
          </div>
        </div>
        <button
          onClick={reset}
          className="btn btn-ghost btn-sm border-base-100"
        >
          ↺ Reset
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] lg:grid-cols-[160px_1fr] gap-6 md:gap-8 items-start">
        {/* Left Actions */}
        <div className="flex flex-row md:flex-col items-center md:items-stretch gap-4 p-3 bg-base-200 rounded-2xl border border-base-100">
          <div className="w-20 sm:w-24 md:w-full shrink-0 aspect-[5/7]">
            {sim.drawPile.length > 0 ? (
              <img
                className="w-full h-full object-cover rounded-lg shadow-xl cursor-pointer hover:ring-4 hover:ring-primary transition-all active:scale-95"
                src="/mtg-card-image-back.jpeg"
                onClick={drawCard}
                alt="Deck Back"
              />
            ) : (
              <div className="w-full h-full border-2 border-dashed border-base-300 rounded-lg flex items-center justify-center">
                <span className="text-[10px] text-base-content/30 uppercase font-bold">
                  Empty
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col gap-3 w-full">
            <div className="form-control">
              <label className="label cursor-pointer bg-base-300 px-3 py-1.5 rounded-lg border border-base-100">
                <span className="label-text text-[9px] uppercase font-bold opacity-60">
                  Auto Discard
                </span>
                <input
                  type="checkbox"
                  className="toggle toggle-primary toggle-xs"
                  checked={autoDiscard}
                  onChange={() => setAutoDiscard(!autoDiscard)}
                />
              </label>
            </div>

            <div className="flex flex-col gap-2">
              <div className="badge badge-neutral w-full py-3 font-mono text-xs">
                {sim.drawPile.length} CARDS
              </div>
              <button
                onClick={discardHand}
                disabled={sim.hand.length === 0 || sim.awaitingDiscard}
                className="btn btn-error btn-outline btn-xs w-full"
              >
                Discard Hand
              </button>
            </div>
          </div>
        </div>

        {/* Hand Area */}
        <div className="flex flex-col gap-6">
          {sim.awaitingDiscard && (
            <div className="alert alert-warning shadow-lg text-xs py-2">
              <span>
                You drew a card — click a card in your hand to discard it.
              </span>
            </div>
          )}

          <div className="min-h-[200px]">
            {sim.hand.length === 0 ? (
              <div className="h-full flex items-center justify-center opacity-40 italic text-sm">
                {deckExhausted ? "Deck exhausted." : "No cards in hand."}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2 min-[800px]:hidden">
                  {sim.hand.map((card) => {
                    const isBasicLand = BASIC_LAND_NAMES.includes(
                      card.name.toLowerCase(),
                    );
                    return (
                      <div
                        key={card.id}
                        onClick={() =>
                          sim.awaitingDiscard
                            ? discardCard(card.id)
                            : selectCard(card)
                        }
                        className={`relative w-full aspect-[5/7] rounded-lg border-2 cursor-pointer transition-all ${
                          sim.selectedCard?.id === card.id
                            ? "border-primary shadow-2xl scale-105 z-10"
                            : "border-base-300"
                        }`}
                      >
                        {card.image_uris?.normal ? (
                          <img
                            src={
                              isBasicLand
                                ? configureBasicLandEndpoint(card.name)
                                : card.image_uris.normal
                            }
                            alt={card.name}
                            className="w-full h-full object-cover rounded-md"
                          />
                        ) : (
                          <div className="w-full h-full bg-base-200 flex items-center justify-center p-2 text-center text-[10px]">
                            {card.name}
                          </div>
                        )}
                        {sim.awaitingDiscard && (
                          <div className="absolute inset-0 bg-error/40 flex items-center justify-center rounded-md">
                            <span className="badge badge-error shadow-lg">
                              DISCARD
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="hidden min-[800px]:flex min-[800px]:flex-row min-[800px]:items-end min-[800px]:justify-center pb-10 pt-4">
                  {sim.hand.map((card, index) => {
                    const isBasicLand = BASIC_LAND_NAMES.includes(
                      card.name.toLowerCase(),
                    );
                    const isSelected = sim.selectedCard?.id === card.id;
                    return (
                      <div
                        key={card.id}
                        style={getCardStyle(index, card.id, isSelected)}
                        onMouseEnter={() => setHoveredCardId(card.id)}
                        onMouseLeave={() => setHoveredCardId(null)}
                        onClick={() =>
                          sim.awaitingDiscard
                            ? discardCard(card.id)
                            : selectCard(card)
                        }
                        className={`relative w-28 lg:w-36 xl:w-44 aspect-[5/7] rounded-xl border-2 cursor-pointer overflow-hidden flex-shrink-0 ${
                          index > 0 ? "-ml-10 lg:-ml-14 xl:-ml-16" : ""
                        } ${isSelected ? "border-primary shadow-2xl" : "border-base-300"}`}
                      >
                        <img
                          src={
                            isBasicLand
                              ? configureBasicLandEndpoint(card.name)
                              : card.image_uris?.normal
                          }
                          alt={card.name}
                          className="w-full h-full object-cover"
                        />
                        {sim.awaitingDiscard && (
                          <div className="absolute inset-0 bg-error/40 z-10 flex items-center justify-center">
                            <span className="badge badge-error">DISCARD</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Floating Selected Card Panel */}
      {sim.selectedCard && (
        <div className="fixed inset-x-0 bottom-4 z-[100] flex justify-center pointer-events-none">
          <div className="card w-80 bg-base-100 shadow-2xl border border-primary/20 pointer-events-auto">
            <div className="card-body p-4">
              <div className="flex justify-between items-start">
                <div className="min-w-0">
                  <h3 className="card-title text-sm truncate">
                    {sim.selectedCard.name}
                  </h3>
                  <p className="text-[10px] opacity-60">
                    {sim.selectedCard.type_line}
                  </p>
                </div>
                <button
                  onClick={() => setSim((s) => ({ ...s, selectedCard: null }))}
                  className="btn btn-ghost btn-xs btn-circle"
                >
                  ✕
                </button>
              </div>
              <div className="divider my-0"></div>
              <div className="flex flex-wrap gap-1 mt-2">
                {sim.selectedCard.objectiveIds.map((oid) => {
                  const o = objectives.find((obj) => obj.id === oid);
                  return (
                    o && <ObjectivePill key={o.id} objective={o} size="sm" />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Objectives Panel */}
      {ObjectivesPanel}
    </div>
  );
}
