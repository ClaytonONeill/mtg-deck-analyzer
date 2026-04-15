// Modules
import { useState, useCallback, useMemo } from 'react';

// Types
import type { Deck, DeckEntry, Objective } from '@/types';

// Components
import ObjectivePill from '@/features/objectives/components/ObjectivePill';

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

  const reset = useCallback(() => {
    setSim(initState(deck.entries));
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

      <div className="grid grid-cols-1 md:grid-cols-[100px_1fr_200px] gap-6 items-start">
        {/* Left: deck pile + actions */}
        <div className="flex flex-col gap-3">
          {sim.drawPile.length > 0 && (
            <img
              className="w-40 mb-6 hover:cursor-pointer"
              src="/mtg-card-image-back.jpeg"
            ></img>
            // <div className="w-20 aspect-[5/7] bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center text-2xl font-bold text-white">
            //   {sim.drawPile.length}
            // </div>
          )}
          <p className="text-xs text-slate-500">
            {sim.drawPile.length > 0
              ? `${sim.drawPile.length} left`
              : 'Deck empty'}
          </p>
          <button
            onClick={drawCard}
            disabled={sim.drawPile.length === 0 || sim.awaitingDiscard}
            className="text-xs font-semibold text-white border border-slate-700 hover:border-slate-500 px-3 py-2 rounded-lg transition-colors hover:cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Draw card
          </button>
          <button
            onClick={discardHand}
            disabled={sim.hand.length === 0 || sim.awaitingDiscard}
            className="text-xs font-semibold text-red-400 border border-red-800 hover:border-red-600 px-3 py-2 rounded-lg transition-colors hover:cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Discard hand
          </button>
          <div className="mt-2">
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">
              Discard
            </p>
            <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-400">
              {sim.discard.length} card{sim.discard.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Middle: hand + selected */}
        <div className="flex flex-col gap-4">
          {sim.awaitingDiscard && (
            <div className="bg-amber-950 border border-amber-800 text-amber-300 text-xs rounded-lg px-3 py-2.5">
              You drew a card — click a card in your hand to discard it.
            </div>
          )}

          <div>
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">
              Current hand
            </p>
            {sim.hand.length === 0 ? (
              <p className="text-slate-500 text-sm italic">
                {deckExhausted
                  ? 'Deck exhausted — no more actions.'
                  : 'No cards in hand.'}
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {sim.hand.map((card) => (
                  <div
                    key={card.id}
                    onClick={() =>
                      sim.awaitingDiscard
                        ? discardCard(card.id)
                        : selectCard(card)
                    }
                    className={`relative w-16 aspect-[5/7] rounded-lg border cursor-pointer transition-all duration-150 overflow-hidden flex items-center justify-center ${
                      sim.selectedCard?.id === card.id
                        ? 'border-[#1971c2] -translate-y-2 shadow-lg'
                        : sim.awaitingDiscard
                          ? 'border-amber-700 hover:-translate-y-1 hover:border-red-500'
                          : 'border-slate-700 hover:-translate-y-1'
                    }`}
                    title={
                      sim.awaitingDiscard ? `Discard ${card.name}` : card.name
                    }
                  >
                    {card.image_uris?.normal ? (
                      <img
                        src={card.image_uris.normal}
                        alt={card.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-800 flex items-center justify-center p-1">
                        <span className="text-slate-400 text-[9px] text-center leading-tight">
                          {card.name}
                        </span>
                      </div>
                    )}
                    {sim.awaitingDiscard && (
                      <div className="absolute inset-0 bg-red-950/40 flex items-center justify-center">
                        <span className="text-red-300 text-[10px] font-semibold">
                          Discard?
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selected card detail */}
          {sim.selectedCard && (
            <div className="flex gap-3 bg-slate-900 border border-slate-800 rounded-xl p-3">
              {sim.selectedCard.image_uris?.normal ? (
                <img
                  src={sim.selectedCard.image_uris.normal}
                  alt={sim.selectedCard.name}
                  className="w-24 rounded-lg flex-shrink-0"
                />
              ) : (
                <div className="w-24 aspect-[5/7] bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-slate-500 text-xs text-center px-1">
                    {sim.selectedCard.name}
                  </span>
                </div>
              )}
              <div className="flex flex-col gap-1.5 min-w-0">
                <p className="text-white font-semibold text-sm truncate">
                  {sim.selectedCard.name}
                </p>
                <p className="text-slate-400 text-xs">
                  {sim.selectedCard.type_line}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-1">
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
        </div>

        {/* Right: objective bar chart */}
        <div className="flex flex-col gap-2">
          <p className="text-xs text-slate-500 uppercase tracking-widest">
            Objectives by turn {sim.turn}
          </p>
          {objectives.length === 0 ? (
            <p className="text-slate-600 text-xs italic">
              No objectives defined.
            </p>
          ) : Object.keys(sim.objCounts).length === 0 ? (
            <p className="text-slate-600 text-xs italic">
              Draw cards to track objectives.
            </p>
          ) : (
            objectives.map((o) => {
              const count = sim.objCounts[o.id] ?? 0;
              const pct = Math.round((count / maxObjCount) * 100);
              return (
                <div key={o.id} className="flex items-center gap-2">
                  <span
                    className="text-xs w-16 shrink-0 truncate"
                    style={{ color: o.color }}
                    title={o.label}
                  >
                    {o.label}
                  </span>
                  <div className="flex-1 bg-slate-800 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${pct}%`, backgroundColor: o.color }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 w-4 text-right">
                    {count}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
