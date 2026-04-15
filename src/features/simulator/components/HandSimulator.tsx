// Modules
import { useState, useCallback, useMemo } from 'react';

// Types
import type { Deck, DeckEntry, Objective } from '@/types';

// Components
import ObjectivePill from '@/features/objectives/components/ObjectivePill';

// Utils
import { BASIC_LAND_NAMES, configureBasicLandEndpoint } from '@/utils/utils';

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
      const [card, ...rest] = s.drawPile;
      return {
        ...s,
        drawPile: rest,
        hand: [...s.hand, card],
        turn: s.turn + 1,
        awaitingDiscard: true,
        objCounts: countObjectives([card], s.objCounts),
      };
    });
  }, []);

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

      <div className="grid grid-cols-1 md:grid-cols-[120px_1fr_220px] gap-6 items-start">
        {/* Left: deck pile + actions */}
        <div className="flex flex-col gap-3">
          <div className="relative w-full aspect-[5/7]">
            {sim.drawPile.length > 0 ? (
              <img
                className="w-full h-full object-cover rounded-lg shadow-md cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
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

          <p className="text-[10px] text-slate-500 text-center uppercase tracking-tighter">
            {sim.drawPile.length > 0
              ? `${sim.drawPile.length} left`
              : 'Deck empty'}
          </p>

          <button
            onClick={discardHand}
            disabled={sim.hand.length === 0 || sim.awaitingDiscard}
            className="text-[10px] uppercase font-bold text-red-400 border border-red-800/40 hover:bg-red-950/20 px-2 py-2 rounded-lg transition-colors hover:cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed"
          >
            Discard hand
          </button>

          <div className="mt-2">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1 text-center">
              Discard
            </p>
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg py-1.5 text-center text-xs font-mono text-slate-400">
              {sim.discard.length}
            </div>
          </div>
        </div>

        {/* Middle: selected (above) + hand (below) */}
        <div className="flex flex-col gap-6">
          {/* Selected card detail */}
          {sim.selectedCard && (
            <div className="flex gap-4 bg-slate-900 border border-blue-900/50 rounded-xl p-4 shadow-xl ring-1 ring-blue-500/20">
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
                  className="w-24 md:w-32 rounded-lg flex-shrink-0 shadow-lg"
                />
              ) : (
                <div className="w-24 md:w-32 aspect-[5/7] bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-slate-500 text-xs text-center px-1">
                    {sim.selectedCard.name}
                  </span>
                </div>
              )}
              <div className="flex flex-col gap-2 min-w-0 py-1">
                <div className="flex flex-col">
                  <p className="text-white font-bold text-lg truncate">
                    {sim.selectedCard.name}
                  </p>
                  <p className="text-slate-400 text-xs">
                    {sim.selectedCard.type_line}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {sim.selectedCard.objectiveIds.length === 0 ? (
                    <span className="text-slate-600 text-xs italic">
                      No objectives
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
          )}

          {sim.awaitingDiscard && (
            <div className="bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs rounded-lg px-3 py-2.5 animate-pulse text-center">
              You drew a card — click a card in your hand to discard it.
            </div>
          )}

          <div>
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">
              Current hand
            </p>
            {sim.hand.length === 0 ? (
              <p className="text-slate-500 text-sm italic">
                {deckExhausted
                  ? 'Deck exhausted — no more actions.'
                  : 'No cards in hand.'}
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-3 md:gap-4">
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
                      className={`relative w-full aspect-[5/7] rounded-xl border cursor-pointer transition-all duration-200 overflow-hidden flex items-center justify-center ${
                        sim.selectedCard?.id === card.id
                          ? 'border-blue-500 ring-2 ring-blue-500/50 -translate-y-2 shadow-2xl z-10'
                          : sim.awaitingDiscard
                            ? 'border-amber-700 hover:border-red-500 hover:shadow-red-900/20'
                            : 'border-slate-700 hover:-translate-y-1 hover:border-slate-500 shadow-md'
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
                          <span className="text-slate-400 text-[10px] md:text-xs leading-tight">
                            {card.name}
                          </span>
                        </div>
                      )}
                      {sim.awaitingDiscard && (
                        <div className="absolute inset-0 bg-red-950/60 backdrop-blur-[1px] flex items-center justify-center">
                          <span className="text-red-100 text-[10px] font-bold bg-red-600 px-1.5 py-0.5 rounded shadow-lg">
                            DISCARD
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: objective bar chart */}
        <div className="flex flex-col gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-widest">
              Objectives
            </p>
            <p className="text-[10px] text-slate-600">Turn {sim.turn}</p>
          </div>

          <div className="flex flex-col gap-3">
            {objectives.length === 0 ? (
              <p className="text-slate-600 text-xs italic">
                No objectives defined.
              </p>
            ) : Object.keys(sim.objCounts).length === 0 ? (
              <p className="text-slate-600 text-xs italic">
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
                          className="text-[10px] font-medium truncate pr-2"
                          style={{ color: o.color }}
                        >
                          {o.label}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {count}
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
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
      </div>
    </div>
  );
}
