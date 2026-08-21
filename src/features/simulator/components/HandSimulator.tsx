// Modules
import { useState, useCallback, useMemo } from "react";

// Types
import type { Deck, DeckEntry, Objective } from "@/types";

// Components
import ObjectivePill from "@/features/objectives/components/ObjectivePill";

// Utils
import { BASIC_LAND_NAMES, configureBasicLandEndpoint } from "@/utils/utils";
import {
  computeAvailableMana,
  isCreatureType,
  isLand,
  isPermanentType,
  parseManaCost,
  tryPayCost,
  type ManaColor,
} from "@/features/simulator/utils/manaUtils";
import { X } from "lucide-react";

interface HandSimulatorProps {
  deck: Deck;
  objectives: Objective[];
}

interface SimCard {
  id: string;
  entryId: string;
  name: string;
  type_line: string;
  mana_cost: string;
  oracle_text: string;
  image_uris?: { normal?: string; large?: string };
  objectiveIds: string[];
}

interface PermanentInPlay {
  card: SimCard;
  tapped: boolean;
  /** Turn number it entered play — used for creature summoning sickness. */
  enteredTurn: number;
}

interface SimState {
  drawPile: SimCard[];
  hand: SimCard[];
  discard: SimCard[];
  permanentsInPlay: PermanentInPlay[];
  landPlayedThisTurn: boolean;
  turn: number;
  awaitingDiscard: boolean;
  selectedCard: SimCard | null;
  objCounts: Record<string, number>;
  lastAutoDiscard: SimCard | null;
  castError: string | null;
}

const MANA_COLOR_ORDER: ManaColor[] = ["W", "U", "B", "R", "G", "C"];

const MANA_PIP_COLORS: Record<ManaColor, string> = {
  W: "#f8f6d8",
  U: "#aad3f2",
  B: "#bdb0c6",
  R: "#f2a482",
  G: "#a8d8ab",
  C: "#c9c9c9",
};

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
        mana_cost: entry.card.mana_cost ?? "",
        oracle_text: entry.card.oracle_text ?? "",
        image_uris: entry.card.image_uris,
        objectiveIds: entry.objectiveIds ?? [],
      });
    }
  });
  return cards;
}

/** Untapped permanents that are actually allowed to tap for mana right now
 * — excludes creatures still summoning-sick (entered this same turn).
 * Non-creature permanents (lands, artifacts, enchantments) are never sick. */
function getEligibleManaSources(
  permanentsInPlay: PermanentInPlay[],
  currentTurn: number,
): PermanentInPlay[] {
  return permanentsInPlay.filter(
    (p) =>
      !p.tapped &&
      (!isCreatureType(p.card.type_line) || p.enteredTurn !== currentTurn),
  );
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
    permanentsInPlay: [],
    landPlayedThisTurn: false,
    turn: 1,
    awaitingDiscard: false,
    selectedCard: null,
    objCounts: countObjectives(hand, {}),
    lastAutoDiscard: null,
    castError: null,
  };
}

export default function HandSimulator({
  deck,
  objectives,
}: HandSimulatorProps) {
  const [sim, setSim] = useState<SimState>(() => initState(deck.entries));
  const [autoDiscard, setAutoDiscard] = useState(false);
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

  const showAllObjectives = useCallback(() => {
    setHiddenObjectives(new Set());
  }, []);

  const drawOne = useCallback(
    (s: SimState): SimState => {
      if (s.drawPile.length === 0 || s.awaitingDiscard) return s;
      const [drawnCard, ...remainingDeck] = s.drawPile;

      if (autoDiscard && s.hand.length >= 7) {
        const firstCardInHand = s.hand[0];
        const newHand = [...s.hand.slice(1), drawnCard];

        return {
          ...s,
          drawPile: remainingDeck,
          hand: newHand,
          discard: [...s.discard, firstCardInHand],
          awaitingDiscard: false,
          selectedCard:
            s.selectedCard?.id === firstCardInHand.id ? null : s.selectedCard,
          objCounts: countObjectives([drawnCard], s.objCounts),
          lastAutoDiscard: firstCardInHand,
        };
      }

      const newHand = [...s.hand, drawnCard];
      return {
        ...s,
        drawPile: remainingDeck,
        hand: newHand,
        objCounts: countObjectives([drawnCard], s.objCounts),
        lastAutoDiscard: null,
      };
    },
    [autoDiscard],
  );

  const drawCard = useCallback(() => {
    setSim((s) => drawOne(s));
  }, [drawOne]);

  const nextTurn = useCallback(() => {
    setSim((s) => {
      if (s.awaitingDiscard) return s;

      // Hand-size cleanup happens at end of turn, not the instant you draw
      // over 7 — you can still play/cast normally mid-turn with 8+ cards.
      if (s.hand.length > 7) {
        return { ...s, awaitingDiscard: true, selectedCard: null };
      }

      const drawn = drawOne(s);
      return {
        ...drawn,
        turn: s.turn + 1,
        permanentsInPlay: drawn.permanentsInPlay.map((p) => ({
          ...p,
          tapped: false,
        })),
        landPlayedThisTurn: false,
        castError: null,
      };
    });
  }, [drawOne]);

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
        selectedCard: null,
        objCounts: countObjectives(newHand, s.objCounts),
        lastAutoDiscard: null,
      };
    });
  }, []);

  const playLand = useCallback((cardId: string) => {
    setSim((s) => {
      const card = s.hand.find((c) => c.id === cardId);
      if (!card || !isLand(card.type_line) || s.landPlayedThisTurn) return s;
      return {
        ...s,
        hand: s.hand.filter((c) => c.id !== cardId),
        permanentsInPlay: [
          ...s.permanentsInPlay,
          { card, tapped: false, enteredTurn: s.turn },
        ],
        landPlayedThisTurn: true,
        selectedCard: null,
        castError: null,
      };
    });
  }, []);

  const castCard = useCallback((cardId: string) => {
    setSim((s) => {
      const card = s.hand.find((c) => c.id === cardId);
      if (!card || isLand(card.type_line)) return s;

      const cost = parseManaCost(card.mana_cost);
      if (cost.hasX) {
        return {
          ...s,
          castError: `${card.name} has an {X} cost — X spells aren't supported in the simulator yet.`,
        };
      }

      const eligible = getEligibleManaSources(s.permanentsInPlay, s.turn).map(
        (p) => p.card,
      );
      const { canPay, sourcesToTap } = tryPayCost(eligible, cost);
      if (!canPay) {
        return {
          ...s,
          castError: `Not enough mana available to cast ${card.name}.`,
        };
      }

      const tapIds = new Set(sourcesToTap.map((c) => c.id));
      const permanentsInPlay = s.permanentsInPlay.map((p) =>
        tapIds.has(p.card.id) ? { ...p, tapped: true } : p,
      );

      const goesToBattlefield = isPermanentType(card.type_line);
      return {
        ...s,
        hand: s.hand.filter((c) => c.id !== cardId),
        permanentsInPlay: goesToBattlefield
          ? [...permanentsInPlay, { card, tapped: false, enteredTurn: s.turn }]
          : permanentsInPlay,
        discard: goesToBattlefield ? s.discard : [...s.discard, card],
        selectedCard: null,
        castError: null,
      };
    });
  }, []);

  const dismissCastError = useCallback(() => {
    setSim((s) => ({ ...s, castError: null }));
  }, []);

  const discardCard = useCallback((cardId: string) => {
    setSim((s) => {
      const card = s.hand.find((c) => c.id === cardId);
      if (!card) return s;
      const hand = s.hand.filter((c) => c.id !== cardId);
      return {
        ...s,
        hand,
        discard: [...s.discard, card],
        // Still over 7 after this discard (e.g. drew several extra cards
        // mid-turn before ending the turn) — keep the discard prompt up.
        awaitingDiscard: hand.length > 7,
        selectedCard: s.selectedCard?.id === cardId ? null : s.selectedCard,
        lastAutoDiscard: null,
      };
    });
  }, []);

  const selectCard = useCallback((card: SimCard) => {
    setSim((s) => ({
      ...s,
      selectedCard: s.selectedCard?.id === card.id ? null : card,
    }));
  }, []);

  const dismissAutoDiscardAlert = useCallback(() => {
    setSim((s) => ({ ...s, lastAutoDiscard: null }));
  }, []);

  const maxObjCount = useMemo(
    () => Math.max(1, ...Object.values(sim.objCounts)),
    [sim.objCounts],
  );

  const deckExhausted = sim.drawPile.length === 0 && sim.hand.length === 0;

  const eligibleManaSources = getEligibleManaSources(
    sim.permanentsInPlay,
    sim.turn,
  ).map((p) => p.card);
  const availableMana = useMemo(
    () => computeAvailableMana(eligibleManaSources),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sim.permanentsInPlay, sim.turn],
  );

  const selectedIsLand = sim.selectedCard
    ? isLand(sim.selectedCard.type_line)
    : false;
  const selectedInHand = sim.selectedCard
    ? sim.hand.some((c) => c.id === sim.selectedCard!.id)
    : false;
  const selectedCastCheck = useMemo(() => {
    if (!sim.selectedCard || selectedIsLand) return null;
    const cost = parseManaCost(sim.selectedCard.mana_cost);
    return { cost, ...tryPayCost(eligibleManaSources, cost) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sim.selectedCard, sim.permanentsInPlay, sim.turn]);

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

  const activeObjectives = objectives.filter(
    (o) => (sim.objCounts[o.id] ?? 0) > 0,
  );

  const ObjectivesPanel = (
    <div className="card bg-base-300 shadow-xl border border-base-100">
      <div className="card-body p-4 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="stats bg-transparent p-0">
            <div className="stat pb-0 pt-0">
              <div className="stat-title text-xs uppercase tracking-widest">
                Card Roles Encountered
              </div>
              <div className="stat-desc text-sm text-info">Turn {sim.turn}</div>
            </div>
          </div>
          {hiddenObjectives.size > 0 && (
            <button
              onClick={showAllObjectives}
              className="btn btn-ghost btn-xs border-base-100"
            >
              Show all ({hiddenObjectives.size} hidden)
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {objectives.length === 0 ? (
            <div className="alert bg-base-200 col-span-full">
              <span className="text-xs italic">No objectives defined.</span>
            </div>
          ) : activeObjectives.length === 0 ? (
            <div className="alert alert-info col-span-full py-2">
              <span className="text-xs">
                Draw cards to begin tracking deck objectives. (Only drawn
                objectives are shown)
              </span>
            </div>
          ) : (
            activeObjectives.map((o) => {
              const count = sim.objCounts[o.id] ?? 0;
              const pct = Math.round((count / maxObjCount) * 100);
              const isHidden = hiddenObjectives.has(o.id);

              return (
                <div
                  key={o.id}
                  onClick={() => toggleObjective(o.id)}
                  className={`flex flex-col gap-2 cursor-pointer group hover:bg-base-200 p-2 rounded-lg transition-all duration-300 ${
                    isHidden ? "opacity-40 grayscale" : ""
                  }`}
                >
                  <div className="flex justify-between items-end px-1">
                    <span
                      className={`text-xs font-bold truncate pr-2 ${
                        isHidden ? "line-through" : ""
                      }`}
                      style={{ color: isHidden ? undefined : o.color }}
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
                        "--progress-color": isHidden ? "currentColor" : o.color,
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
      {/* Keyframe animation for the flying card effect */}
      <style>{`
        @keyframes cardFlyOff {
          0% { transform: translate(0, 0) scale(1) rotate(0deg); opacity: 1; }
          15% { transform: translate(20px, -30px) scale(1.1) rotate(5deg); opacity: 1; }
          100% { transform: translate(-100vw, -100vh) scale(0.4) rotate(-45deg); opacity: 0; }
        }
      `}</style>

      {/* Top bar */}
      <div className="flex items-center justify-between bg-base-200 p-4 rounded-2xl shadow-inner gap-4">
        <div className="flex items-center gap-6">
          <div className="stats bg-transparent">
            <div className="stat pt-0 pb-0">
              <div className="stat-title text-[10px] uppercase">Game Turn</div>
              <div className="stat-value text-2xl text-primary">{sim.turn}</div>
            </div>
          </div>
          {deck.objectives.length > 0 && (
            <div className="hidden sm:flex flex-col gap-1">
              <span className="text-[10px] uppercase font-bold opacity-50 tracking-widest">
                Deck Strategy
              </span>
              <div className="flex flex-wrap gap-1">
                {deck.objectives.map((o) => (
                  <ObjectivePill key={o.id} objective={o} size="sm" />
                ))}
              </div>
            </div>
          )}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold opacity-50 tracking-widest">
              Mana Available
            </span>
            {availableMana.total === 0 ? (
              <span className="text-xs opacity-40 italic">
                No mana sources up
              </span>
            ) : (
              <div className="flex items-center gap-1.5">
                {MANA_COLOR_ORDER.filter(
                  (c) => availableMana.byColor[c] > 0,
                ).map((c) => (
                  <span
                    key={c}
                    className="badge badge-sm font-mono font-bold"
                    style={{
                      backgroundColor: MANA_PIP_COLORS[c],
                      color: "#1a1a1a",
                    }}
                  >
                    {c}
                    {availableMana.byColor[c]}
                  </span>
                ))}
                <span className="text-[10px] opacity-50">
                  ({availableMana.total} mana)
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={nextTurn}
            disabled={sim.awaitingDiscard}
            className="btn btn-primary btn-sm"
          >
            Next Turn
          </button>
          <button
            onClick={reset}
            className="btn btn-ghost btn-sm border-base-100"
          >
            ↺ Reset
          </button>
        </div>
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

          <div className="w-20 sm:w-24 md:w-full shrink-0 aspect-[5/7] relative">
            {sim.discard.length > 0 ? (
              <>
                <img
                  className="w-full h-full object-cover rounded-lg shadow-lg opacity-90 grayscale-[30%]"
                  src={
                    BASIC_LAND_NAMES.includes(
                      sim.discard[sim.discard.length - 1].name.toLowerCase(),
                    )
                      ? configureBasicLandEndpoint(
                          sim.discard[sim.discard.length - 1].name,
                        )
                      : sim.discard[sim.discard.length - 1].image_uris?.normal
                  }
                  alt="Graveyard"
                />
                <span className="badge badge-neutral badge-sm absolute -top-1.5 -right-1.5 font-mono">
                  {sim.discard.length}
                </span>
              </>
            ) : (
              <div className="w-full h-full border-2 border-dashed border-base-300 rounded-lg flex items-center justify-center">
                <span className="text-[10px] text-base-content/30 uppercase font-bold">
                  GY
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
        <div className="flex flex-col gap-4">
          {/* Notifications / Alerts */}
          <div className="min-h-[48px] flex flex-col justify-end">
            {sim.awaitingDiscard && (
              <div className="alert alert-warning shadow-lg text-xs py-2">
                <span>
                  Hand size is over 7 — discard down to end your turn.
                </span>
              </div>
            )}

            {sim.lastAutoDiscard && !sim.awaitingDiscard && (
              <div className="alert alert-info shadow-sm border border-info/30 text-xs py-2 flex justify-between animate-fade-in relative overflow-hidden">
                <div className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    className="stroke-current shrink-0 w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                  <span>
                    Auto-swapped out <strong>{sim.lastAutoDiscard.name}</strong>
                  </span>
                </div>
                <button
                  onClick={dismissAutoDiscardAlert}
                  className="btn btn-ghost btn-xs btn-circle z-10"
                >
                  <X size={12} />
                </button>
              </div>
            )}

            {sim.castError && (
              <div className="alert alert-error shadow-sm text-xs py-2 flex justify-between">
                <span>{sim.castError}</span>
                <button
                  onClick={dismissCastError}
                  className="btn btn-ghost btn-xs btn-circle z-10"
                >
                  <X size={12} />
                </button>
              </div>
            )}
          </div>

          <div className="min-h-[200px] relative">
            {sim.lastAutoDiscard && !sim.awaitingDiscard && (
              <div
                key={`fly-${sim.turn}`}
                className="absolute z-[100] pointer-events-none w-28 lg:w-36 xl:w-44 aspect-[5/7] bottom-10 left-[10%] min-[800px]:left-[20%]"
                style={{ animation: "cardFlyOff 0.8s ease-in forwards" }}
              >
                <img
                  src={
                    BASIC_LAND_NAMES.includes(
                      sim.lastAutoDiscard.name.toLowerCase(),
                    )
                      ? configureBasicLandEndpoint(sim.lastAutoDiscard.name)
                      : sim.lastAutoDiscard.image_uris?.normal
                  }
                  alt="Discarded"
                  className="w-full h-full object-cover rounded-xl shadow-2xl border-2 border-error/50"
                />
              </div>
            )}

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

      {/* Battlefield */}
      {sim.permanentsInPlay.length > 0 && (
        <div className="p-4 bg-base-200 rounded-2xl border border-base-100 flex flex-col gap-4">
          <span className="text-[10px] uppercase font-bold opacity-50 tracking-widest">
            Battlefield
          </span>
          <div className="flex flex-wrap gap-3">
            {[...sim.permanentsInPlay]
              .sort((a, b) =>
                isLand(a.card.type_line) === isLand(b.card.type_line)
                  ? 0
                  : isLand(a.card.type_line)
                    ? -1
                    : 1,
              )
              .map(({ card, tapped, enteredTurn }, i) => {
                const isBasicLand = BASIC_LAND_NAMES.includes(
                  card.name.toLowerCase(),
                );
                const sick =
                  isCreatureType(card.type_line) && enteredTurn === sim.turn;
                const isSelected = sim.selectedCard?.id === card.id;
                return (
                  <div
                    key={`${card.id}-${i}`}
                    onClick={() => selectCard(card)}
                    className={`relative w-14 sm:w-16 aspect-[5/7] rounded-md overflow-hidden shadow-md cursor-pointer transition-colors hover:border-primary ${
                      isSelected
                        ? "border-2 border-primary shadow-lg"
                        : isLand(card.type_line)
                          ? "border border-base-300"
                          : "border border-primary/40"
                    } ${tapped ? "rotate-90 opacity-60" : ""}`}
                    title={`${card.name}${tapped ? " (tapped)" : sick ? " (summoning sick)" : ""}`}
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
                    {sick && !tapped && (
                      <span className="badge badge-neutral badge-xs absolute bottom-0.5 right-0.5 opacity-80">
                        Zzz
                      </span>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Floating Selected Card Panel */}
      {sim.selectedCard && (
        <div className="fixed inset-x-0 bottom-4 z-[100] flex justify-center pointer-events-none px-4">
          <div className="card w-full max-w-xs bg-base-100 shadow-2xl border border-primary/20 pointer-events-auto">
            <div className="card-body p-4 items-center">
              <div className="w-48 sm:w-56 shrink-0 aspect-[5/7] rounded-lg overflow-hidden shadow-lg border border-base-300">
                {sim.selectedCard.image_uris?.normal ? (
                  <img
                    src={
                      BASIC_LAND_NAMES.includes(
                        sim.selectedCard.name.toLowerCase(),
                      )
                        ? configureBasicLandEndpoint(sim.selectedCard.name)
                        : sim.selectedCard.image_uris.normal
                    }
                    alt={sim.selectedCard.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-base-200 flex items-center justify-center p-2 text-center text-[10px]">
                    {sim.selectedCard.name}
                  </div>
                )}
              </div>

              <div className="w-full flex flex-col">
                <div className="flex justify-between items-start w-full mt-2">
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

                {selectedInHand &&
                  (selectedIsLand ? (
                    <button
                      onClick={() => playLand(sim.selectedCard!.id)}
                      disabled={sim.landPlayedThisTurn}
                      className="btn btn-primary btn-sm w-full mt-2"
                    >
                      {sim.landPlayedThisTurn
                        ? "Land already played this turn"
                        : "Play Land"}
                    </button>
                  ) : (
                    <button
                      onClick={() => castCard(sim.selectedCard!.id)}
                      disabled={!selectedCastCheck?.canPay}
                      className="btn btn-primary btn-sm w-full mt-2"
                    >
                      Cast{" "}
                      {sim.selectedCard.mana_cost &&
                        `(${sim.selectedCard.mana_cost})`}
                    </button>
                  ))}

                <div className="divider my-1"></div>
                <div className="flex flex-wrap gap-1">
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
        </div>
      )}

      {/* Objectives Panel */}
      {ObjectivesPanel}
    </div>
  );
}
