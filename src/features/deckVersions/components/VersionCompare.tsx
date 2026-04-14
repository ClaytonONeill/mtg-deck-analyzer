// Modules
import { useState } from 'react';

// Types
import type { Deck } from '@/types';

// Utils
import {
  applyVersionToDeck,
  getVersionLabel,
} from '@/features/deckVersions/utils/versionUtils';
import {
  getTypeBreakdown,
  getCMCBreakdown,
} from '@/features/metrics/utils/deckMetrics';

// Components
import TypesChart from '@/features/metrics/components/TypesChart';
import CMCChart from '@/features/metrics/components/CMCChart';

interface VersionCompareProps {
  deck: Deck;
}

type CompareTarget = 'main' | string;
type ChartView = 'types' | 'cmc';

export default function VersionCompare({ deck }: VersionCompareProps) {
  const [leftId, setLeftId] = useState<CompareTarget>('main');
  const [rightId, setRightId] = useState<CompareTarget>(
    (deck.versions ?? [])[0]?.id ?? 'main',
  );
  const [chartView, setChartView] = useState<ChartView>('types');
  const [includeLands, setIncludeLands] = useState(true);

  const versions = deck.versions ?? [];

  const resolveDeck = (id: CompareTarget): Deck => {
    if (id === 'main') return deck;
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
    { value: 'main', label: `Main — ${deck.name}` },
    ...versions.map((v) => ({ value: v.id, label: v.name })),
  ];

  // Compute card diff between left and right
  const getCardDiff = (fromId: CompareTarget, toId: CompareTarget) => {
    if (fromId === toId) return null;

    // Get the swaps that define the "to" version relative to main
    const toVersion =
      toId === 'main' ? null : versions.find((v) => v.id === toId);
    const fromVersion =
      fromId === 'main' ? null : versions.find((v) => v.id === fromId);

    // Build card sets for each side
    const fromEntryIds = new Set(
      resolveDeck(fromId).entries.map((e) => e.card.id),
    );
    const toEntryIds = new Set(resolveDeck(toId).entries.map((e) => e.card.id));

    const fromEntries = resolveDeck(fromId).entries;
    const toEntries = resolveDeck(toId).entries;

    const removed = fromEntries.filter((e) => !toEntryIds.has(e.card.id));
    const added = toEntries.filter((e) => !fromEntryIds.has(e.card.id));

    // Suppress unused variable warnings
    void toVersion;
    void fromVersion;

    return { removed, added };
  };

  const diff = getCardDiff(leftId, rightId);
  const hasDiff = diff && (diff.removed.length > 0 || diff.added.length > 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Selectors */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { id: leftId, setId: setLeftId, label: 'Left' },
          { id: rightId, setId: setRightId, label: 'Right' },
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

      {/* Card diff */}
      {hasDiff && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
          <p className="text-xs text-slate-400 uppercase tracking-widest">
            Cards Changed — {getVersionLabel(deck, leftId)} →{' '}
            {getVersionLabel(deck, rightId)}
          </p>
          <div className="grid grid-cols-2 gap-4">
            {/* Removed from left */}
            <div className="flex flex-col gap-1.5">
              <p className="text-xs text-red-400 uppercase tracking-widest">
                − Removed ({diff.removed.length})
              </p>
              {diff.removed.length === 0 ? (
                <p className="text-slate-600 text-xs italic">
                  No cards removed
                </p>
              ) : (
                diff.removed.map((e) => (
                  <div key={e.card.id} className="flex items-center gap-2">
                    {e.card.image_uris?.small && (
                      <img
                        src={e.card.image_uris.small}
                        alt={e.card.name}
                        className="w-8 rounded shrink-0"
                      />
                    )}
                    <span className="text-red-300 text-xs truncate">
                      {e.card.name}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Added in right */}
            <div className="flex flex-col gap-1.5">
              <p className="text-xs text-green-400 uppercase tracking-widest">
                + Added ({diff.added.length})
              </p>
              {diff.added.length === 0 ? (
                <p className="text-slate-600 text-xs italic">No cards added</p>
              ) : (
                diff.added.map((e) => (
                  <div key={e.card.id} className="flex items-center gap-2">
                    {e.card.image_uris?.small && (
                      <img
                        src={e.card.image_uris.small}
                        alt={e.card.name}
                        className="w-8 rounded shrink-0"
                      />
                    )}
                    <span className="text-green-300 text-xs truncate">
                      {e.card.name}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {!hasDiff && leftId !== rightId && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-3">
          <p className="text-slate-500 text-xs text-center">
            No card differences between these versions.
          </p>
        </div>
      )}

      {/* Chart type + land toggle controls */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-slate-800 p-1 rounded-lg">
          {(['types', 'cmc'] as ChartView[]).map((view) => (
            <button
              key={view}
              onClick={() => setChartView(view)}
              className="px-4 py-1.5 rounded-md text-sm font-semibold transition-colors hover:cursor-pointer"
              style={{
                backgroundColor: chartView === view ? '#1971c2' : 'transparent',
                color: chartView === view ? '#fff' : '#64748b',
              }}
            >
              {view === 'types' ? 'Types' : 'CMC Curve'}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer select-none">
          <div
            onClick={() => setIncludeLands((v) => !v)}
            className="w-9 h-5 rounded-full transition-colors relative cursor-pointer"
            style={{ backgroundColor: includeLands ? '#1971c2' : '#334155' }}
          >
            <span
              className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200"
              style={{ left: includeLands ? '18px' : '2px' }}
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
            side: 'left',
            typeData: leftTypeData,
            cmcData: leftCMCData,
          },
          {
            id: rightId,
            side: 'right',
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
            {chartView === 'types' ? (
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
