// Modules
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

// Stores
import { deckStore, getDeckCardCount } from '@/store/deckStore';

// Hooks
import { useObjectives } from '@/features/objectives/hooks/useObjectives';

// Utils
import {
  getTypeBreakdown,
  getCMCBreakdown,
} from '@/features/metrics/utils/deckMetrics';

// Components
import TypesChart from '@/features/metrics/components/TypesChart';
import CMCChart from '@/features/metrics/components/CMCChart';
import ColorPip from '@/components/ManaSymbol/ColorPip';
import ObjectivesTab from '@/features/objectives/components/ObjectivesTab';
import CardGallery from '@/features/gallery/components/CardGallery';

// Types
import type { Deck } from '@/types';

type Tab = 'metrics' | 'objectives' | 'gallery' | 'decks';
type MetricView = 'types' | 'cmc';

export default function DeckDetailPage() {
  // State
  const [activeTab, setActiveTab] = useState<Tab>('metrics');
  const [metricView, setMetricView] = useState<MetricView>('types');
  const [includeLands, setIncludeLands] = useState(true);
  const [deck, setDeck] = useState<Deck | undefined>(() => {
    const { deckId } = { deckId: window.location.pathname.split('/').pop() };
    return deckId ? deckStore.getById(deckId) : undefined;
  });

  const { deckId } = useParams();
  const navigate = useNavigate();

  // Re-read deck from store on mount using the param
  const liveDeck = deckId ? deckStore.getById(deckId) : undefined;

  const {
    objectives,
    entries,
    createObjective,
    deleteObjective,
    assignObjective,
    unassignObjective,
    updateObjective,
  } = useObjectives(
    deck ??
      liveDeck ?? {
        id: '',
        name: '',
        commander: null,
        partner: null,
        colorIdentity: [],
        entries: [],
        objectives: [],
        createdAt: '',
        updatedAt: '',
      },
    (updated) => {
      setDeck(updated);
    },
  );

  if (!liveDeck && !deck) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Deck not found.{' '}
        <button
          onClick={() => navigate('/')}
          className="ml-2 text-[#1971c2] hover:underline hover:cursor-pointer"
        >
          Go home
        </button>
      </div>
    );
  }

  const activeDeck = deck ?? liveDeck!;
  const cardCount = getDeckCardCount(activeDeck);
  const typeData = getTypeBreakdown(activeDeck, includeLands);
  const cmcData = getCMCBreakdown(activeDeck, includeLands);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'metrics', label: 'Metrics' },
    { key: 'objectives', label: 'Objectives' },
    { key: 'gallery', label: 'Gallery' },
    { key: 'decks', label: 'Decks' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
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
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Deck identity block */}
        <div className="mb-8 flex items-start justify-between gap-4">
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

          {/* Card count */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span
              className="text-3xl font-bold font-mono"
              style={{ color: cardCount === 100 ? '#1971c2' : '#f1f5f9' }}
            >
              {cardCount}
            </span>
            <span className="text-slate-500 text-xs">/ 100 cards</span>
            <div className="w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min((cardCount / 100) * 100, 100)}%`,
                  backgroundColor: '#1971c2',
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
              className="pb-3 text-sm font-semibold transition-colors relative hover:cursor-pointer"
              style={{ color: activeTab === tab.key ? '#1971c2' : '#64748b' }}
            >
              {tab.label}
              {activeTab === tab.key && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                  style={{ backgroundColor: '#1971c2' }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'metrics' && (
          <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
              <div className="flex gap-1 bg-slate-800 p-1 rounded-lg">
                {(['types', 'cmc'] as MetricView[]).map((view) => (
                  <button
                    key={view}
                    onClick={() => setMetricView(view)}
                    className="px-4 py-1.5 rounded-md text-sm font-semibold transition-colors hover:cursor-pointer"
                    style={{
                      backgroundColor:
                        metricView === view ? '#1971c2' : 'transparent',
                      color: metricView === view ? '#fff' : '#64748b',
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
                  style={{
                    backgroundColor: includeLands ? '#1971c2' : '#334155',
                  }}
                >
                  <span
                    className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200"
                    style={{ left: includeLands ? '18px' : '2px' }}
                  />
                </div>
                Include Lands
              </label>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-6">
                {metricView === 'types' ? 'Card Types' : 'Mana Curve'}
              </h2>
              {metricView === 'types' ? (
                <TypesChart data={typeData} />
              ) : (
                <CMCChart data={cmcData} />
              )}
            </div>
          </div>
        )}

        {activeTab === 'objectives' && (
          <ObjectivesTab
            deck={activeDeck}
            objectives={objectives}
            entries={entries}
            onCreate={createObjective}
            onDelete={deleteObjective}
            onUpdate={updateObjective}
            onUnassign={unassignObjective}
          />
        )}

        {activeTab === 'gallery' && (
          <CardGallery
            entries={entries}
            objectives={objectives}
            onAssign={assignObjective}
            onUnassign={unassignObjective}
          />
        )}

        {activeTab === 'decks' && (
          <div className="flex items-center justify-center py-24 text-slate-500 text-sm">
            Decks tab coming soon.
          </div>
        )}
      </div>
    </div>
  );
}
