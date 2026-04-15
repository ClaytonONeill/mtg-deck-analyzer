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

  // Shared objectives panel — rendered once, used below everything
  const ObjectivesPanel = (
    <div className="flex flex-col gap-4 bg-slate-900/50 p-3 sm:p-4 rounded-xl border border-slate-800">
      <div className="flex justify-between items-end">
        <div>
          <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-widest">
            Objectives
          </p>
          <p className="text-[9px] sm:text-[10px] text-slate-600">
            Turn {sim.turn}
          </p>
        </div>
        <p className="text-[9px] text-slate-600 italic">Click to hide</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-3">
        {objectives.length === 0 ? (
          <p className="text-slate-600 text-[10px] sm:text-xs italic col-span-full">
            No objectives defined.
          </p>
        ) : Object.keys(sim.objCounts).length === 0 ? (
          <p className="text-slate-600 text-[10px] sm:text-xs italic col-span-full">
            Draw cards to track.
          </p>
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
                  className="flex flex-col gap-1 cursor-pointer group"
                >
                  <div className="flex justify-between items-center">
                    <span
                      className="text-[10px] sm:text-xs font-medium truncate pr-2 group-hover:opacity-80 transition-opacity"
                      style={{ color: o.color }}
                    >
                      {o.label}
                    </span>
                    <span className="text-[10px] sm:text-xs text-slate-400 font-mono">
                      {count}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 sm:h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${pct}%`, backgroundColor: o.color }}
                    />
                  </div>
                </div>
              );
            })
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-widest">
            Turn
          </p>
          <p className="text-3xl font-bold text-white">{sim.turn}</p>
        </div>
        <button
          onClick={reset}
          className="text-xs text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-1.5 rounded-lg transition-colors hover:cursor-pointer"
        >
          ↺ Reset
        </button>
      </div>

      {/* Deck + hand row — two columns only, objectives removed from here */}
      <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] lg:grid-cols-[160px_1fr] gap-6 md:gap-8 items-start">
        {/* Left: deck pile + actions */}
        <div className="flex flex-row md:flex-col items-center md:items-stretch gap-4 md:gap-3 bg-slate-900/40 md:bg-transparent p-3 md:p-0 rounded-xl border border-slate-800/50 md:border-transparent">
          <div className="w-20 sm:w-24 md:w-full shrink-0 aspect-[5/7]">
            {sim.drawPile.length > 0 ? (
              <img
                className="w-full h-full object-cover rounded-lg shadow-md cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all active:scale-95"
                src="/mtg-card-image-back.jpeg"
                onClick={drawCard}
                alt="Deck Back"
              />
            ) : (
              <div className="w-full h-full border-2 border-dashed border-slate-800 rounded-lg flex items-center justify-center">
                <span className="text-[10px] text-slate-700 uppercase font-bold">
                  Empty
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col sm:flex-row md:flex-col gap-3 md:gap-2 justify-center w-full">
            <button
              onClick={() => setAutoDiscard(!autoDiscard)}
              className="flex items-center justify-between gap-2 px-2 py-1.5 bg-slate-900/50 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors"
            >
              <span className="text-[9px] uppercase font-bold text-slate-500">
                Auto Discard
              </span>
              <div
                className={`w-6 h-3 rounded-full relative transition-colors ${autoDiscard ? "bg-blue-600" : "bg-slate-700"}`}
              >
                <div
                  className={`absolute top-0.5 w-2 h-2 bg-white rounded-full transition-all ${autoDiscard ? "left-3.5" : "left-0.5"}`}
                />
              </div>
            </button>

            <div className="flex-1 flex flex-col justify-center items-center md:items-stretch gap-2">
              <p className="text-[10px] sm:text-xs md:text-[10px] text-slate-500 text-center uppercase tracking-widest font-bold">
                {sim.drawPile.length} Left
              </p>
              <button
                onClick={discardHand}
                disabled={sim.hand.length === 0 || sim.awaitingDiscard}
                className="w-full text-[10px] sm:text-xs md:text-[10px] uppercase font-bold text-red-400 border border-red-800/40 hover:bg-red-950/30 px-2 py-2 md:py-2.5 rounded-lg transition-colors hover:cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed"
              >
                Discard Hand
              </button>
            </div>
          </div>
        </div>

        {/* Middle: selected card detail + hand */}
        <div className="flex flex-col gap-6">
          {sim.awaitingDiscard && (
            <div className="bg-amber-950/40 border border-amber-800/60 text-amber-300 text-[10px] sm:text-xs rounded-lg px-3 py-2.5 animate-pulse text-center">
              You drew a card — click a card in your hand to discard it.
            </div>
          )}

          <div>
            {sim.hand.length === 0 ? (
              <p className="text-slate-500 text-xs sm:text-sm italic">
                {deckExhausted
                  ? "Deck exhausted — no more actions."
                  : "No cards in hand."}
              </p>
            ) : (
              <>
                {/* Mobile: 2-col grid */}
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
                        className={`relative w-full aspect-[5/7] rounded-lg border cursor-pointer transition-all duration-200 overflow-hidden flex items-center justify-center ${
                          sim.selectedCard?.id === card.id
                            ? "border-blue-500 ring-2 ring-blue-500/50 -translate-y-1 shadow-2xl z-10"
                            : sim.awaitingDiscard
                              ? "border-amber-700 hover:border-red-500"
                              : "border-slate-700 hover:-translate-y-1 hover:border-slate-500 shadow-md"
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
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-800 flex items-center justify-center p-2 text-center">
                            <span className="text-slate-400 text-[11px] leading-tight">
                              {card.name}
                            </span>
                          </div>
                        )}
                        {sim.awaitingDiscard && (
                          <div className="absolute inset-0 bg-red-950/60 backdrop-blur-[1px] flex items-center justify-center">
                            <span className="text-red-100 text-[11px] font-bold bg-red-600 px-2 py-1 rounded shadow-lg">
                              DISCARD
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Desktop: fan hand */}
                <div className="hidden min-[800px]:flex min-[800px]:flex-row min-[800px]:items-end min-[800px]:justify-center pb-10 pt-4 w-full max-w-full">
                  {sim.hand.map((card, index) => {
                    const isBasicLand = BASIC_LAND_NAMES.includes(
                      card.name.toLowerCase(),
                    );
                    const isSelected = sim.selectedCard?.id === card.id;
                    const cardStyle = getCardStyle(index, card.id, isSelected);

                    return (
                      <div
                        key={card.id}
                        style={cardStyle}
                        onMouseEnter={() => setHoveredCardId(card.id)}
                        onMouseLeave={() => setHoveredCardId(null)}
                        onClick={() =>
                          sim.awaitingDiscard
                            ? discardCard(card.id)
                            : selectCard(card)
                        }
                        className={`relative w-28 lg:w-36 xl:w-44 aspect-[5/7] rounded-xl border cursor-pointer overflow-hidden flex items-center justify-center flex-shrink-0 ${
                          index > 0 ? "-ml-10 lg:-ml-14 xl:-ml-16" : ""
                        } ${
                          isSelected
                            ? "border-blue-500 ring-2 ring-blue-500/50 shadow-2xl shadow-blue-900/40"
                            : sim.awaitingDiscard
                              ? "border-amber-700 hover:border-red-500"
                              : "border-slate-700 hover:border-slate-400 shadow-md"
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
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-800 flex items-center justify-center p-2 text-center">
                            <span className="text-slate-400 text-xs leading-tight">
                              {card.name}
                            </span>
                          </div>
                        )}
                        {sim.awaitingDiscard && (
                          <div className="absolute inset-0 bg-red-950/60 backdrop-blur-[1px] flex items-center justify-center z-10">
                            <span className="text-red-100 text-xs font-bold bg-red-600 px-2 py-1 rounded shadow-lg">
                              DISCARD
                            </span>
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
        <div
          className="
      fixed inset-x-0 bottom-0 
      md:inset-auto md:bottom-4 md:right-4
      z-[100]
      flex justify-center md:block
      px-3 pb-3 md:p-0
      w-[20rem]
    "
        >
          <div
            className="
        bg-slate-900 border border-blue-900/50 
        rounded-xl shadow-2xl ring-1 ring-blue-500/20 
        backdrop-blur-md
        w-full max-w-md
        h-[10rem] sm:h-[12rem] md:h-[15rem]

        flex flex-col
      "
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-slate-800">
              <div className="min-w-0">
                <p className="text-white font-bold text-sm truncate">
                  {sim.selectedCard.name}
                </p>
                <p className="text-slate-400 text-[10px] truncate">
                  {sim.selectedCard.type_line}
                </p>
              </div>

              <button
                onClick={() => setSim((s) => ({ ...s, selectedCard: null }))}
                className="text-slate-400 hover:text-white text-xs ml-2 flex-shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Body (scrollable) */}
            <div className="flex gap-3 p-3 overflow-y-auto flex-1">
              {/* Content */}
              <div className="flex flex-col gap-2 min-w-0">
                <p className="text-[10px] uppercase text-slate-500">
                  Objectives
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {sim.selectedCard.objectiveIds.length === 0 ? (
                    <span className="text-slate-600 text-[10px] italic">
                      None
                    </span>
                  ) : (
                    sim.selectedCard.objectiveIds
                      .map((oid) => objectives.find((o) => o.id === oid))
                      .filter((o): o is Objective => Boolean(o))
                      .map((o) => (
                        <ObjectivePill key={o.id} objective={o} size="sm" />
                      ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Objectives — always full width below everything */}
      {ObjectivesPanel}
    </div>
  );
}
