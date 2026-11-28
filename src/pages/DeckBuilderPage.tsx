// Modules
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

// Hooks
import { useDeckBuilder } from '@/features/deckBuilder/hooks/useDeckBuilder';
import { useCardHoverPreview } from '@/hooks/useCardHoverPreview';

// Store
import {
  getDeckCardCount,
  getAllCardIdsInDeck,
  changeDeckFormat,
} from '@/store/deckStore';

// Utils
import {
  FORMATS,
  FORMAT_ORDER,
  getDeckViolations,
  getRules,
  getSideboardCount,
  isDeckFormat,
} from '@/features/formats/formats';

// Context
import { CardPriceProvider } from '@/context/CardPriceContext';

// Components
import CardSearchPanel from '@/features/deckBuilder/components/CardSearchPanel';
import CardPrice from '@/components/CardPrice/CardPrice';
import BasicLandsPanel from '@/features/deckBuilder/components/BasicLandsPanel';
import DeckEntryList from '@/features/deckBuilder/components/DeckEntryList';
import DeckStatsPanel from '@/features/deckBuilder/components/DeckStatsPanel';
import ColorPip from '@/components/ManaSymbol/ColorPip';
import ImportDeckButton from '@/components/ImportDeckButton/ImportDeckButton';
import PageShell from '@/components/PageShell/PageShell';
import ConfirmDelete from '@/components/ConfirmDelete/ConfirmDelete';

// Types
import type { Deck, DeckFormat, DeckZone } from '@/types';
import type { AddWarning } from '@/features/deckBuilder/hooks/useDeckBuilder';

// Icons
import { TriangleAlert, X } from 'lucide-react';

// `/build` and `/build/:deckId` render the same element, so React Router reuses
// the mounted instance when navigating between them (e.g. "New Deck" while
// editing). Keying on deckId forces a fresh mount so no builder state leaks.
export default function DeckBuilderPage() {
  const { deckId } = useParams();
  return <DeckBuilder key={deckId ?? 'new'} deckId={deckId} />;
}

function DeckBuilder({ deckId }: { deckId?: string }) {
  const navigate = useNavigate();

  const {
    deck,
    commitCards,
    loading,
    saveStatus,
    retrySave,
    addWarning,
    partnerWarning,
    commanderHasPartner,
    requiredPartnerName,
    setName,
    setFormat,
    setCommander,
    setPartner,
    removePartner,
    addCard,
    saveDeck,
    clearAddWarning,
    clearPartnerWarning,
  } = useDeckBuilder(deckId);

  // Which zone the card search adds to (60-card formats only).
  const [zone, setZone] = useState<DeckZone>('main');
  // A format change on a deck that already has cards waits for confirmation.
  const [pendingFormat, setPendingFormat] = useState<DeckFormat | null>(null);

  const { previewProps, hidePreview, preview } = useCardHoverPreview();

  const rules = getRules(deck);
  const cardCount = getDeckCardCount(deck);
  const sideCount = getSideboardCount(deck);
  const mainFull = rules.mainMax !== null && cardCount >= rules.mainMax;
  const activeZone: DeckZone = rules.sideboardMax > 0 ? zone : 'main';
  const searchFull =
    activeZone === 'side' ? sideCount >= rules.sideboardMax : mainFull;
  // Commander decks pick a commander before anything else.
  const canAddCards = !rules.hasCommander || !!deck.commander;
  const hasCards =
    deck.entries.length > 0 || sideCount > 0 || !!deck.commander;

  const requestFormat = (value: string) => {
    if (!isDeckFormat(value) || value === rules.id) return;
    if (hasCards) setPendingFormat(value);
    else setFormat(value);
  };

  const pendingViolations = pendingFormat
    ? getDeckViolations(changeDeckFormat(deck, pendingFormat)).filter(
        (v) => v.cardName,
      ).length
    : 0;

  const handleSave = async () => {
    if (await saveDeck()) navigate('/');
  };

  if (loading) {
    return (
      <PageShell tone="recessed" className="flex flex-col gap-4 items-center justify-center">
        <span className="loading loading-ring loading-lg text-primary"></span>
        <p className="text-base-content/60 text-sm font-medium tracking-widest uppercase">
          Loading deck...
        </p>
      </PageShell>
    );
  }

  return (
    <CardPriceProvider cardIds={getAllCardIdsInDeck(deck)}>
    <PageShell tone="recessed">
      {/* Navbar */}
      <header className="navbar bg-base-100 px-6 border-b border-base-content/10 sticky z-5 top-0 shadow-sm">
        <div className="flex h-min gap-3 justify-end items-center w-full">
          <span
            role="status"
            className={`text-xs md:text-sm mr-auto ${saveStatus === "error" ? "text-error" : "text-base-content/60"}`}
          >
            {!deck.name.trim() && deck.entries.length > 0
              ? "Name your deck to autosave cards"
              : saveStatus === "saving"
                ? "Saving..."
                : saveStatus === "saved"
                  ? "All changes saved"
                  : null}
            {saveStatus === "error" && (
              <>
                Couldn't save your last change.{" "}
                <button
                  type="button"
                  onClick={() => void retrySave()}
                  className="link font-semibold"
                >
                  Retry
                </button>
              </>
            )}
          </span>
          {!deckId && (
            <ImportDeckButton
              onImported={(deck: Deck) => navigate(`/deck/${deck.id}`)}
            />
          )}
          <button
            onClick={handleSave}
            disabled={!deck.name.trim()}
            className="btn btn-success btn-sm px-4"
          >
            Save Deck
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-8">
        <div className="flex flex-col gap-10 min-w-0 lg:col-start-1">
          {/* Deck Header Info */}
          <section className="space-y-6">
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-bold uppercase tracking-widest text-xs opacity-60">
                  Deck Identity
                </span>
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={deck.name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Name your masterpiece..."
                  className="input input-bordered input-lg w-full min-w-0 bg-base-100 font-bold focus:input-primary"
                />
                <select
                  value={rules.id}
                  onChange={(e) => requestFormat(e.target.value)}
                  aria-label="Deck format"
                  className="select select-bordered select-lg w-full sm:w-48 shrink-0 bg-base-100 font-bold text-base"
                >
                  {FORMAT_ORDER.map((f) => (
                    <option key={f} value={f}>
                      {FORMATS[f].label}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs md:text-sm text-base-content/60 mt-2">
                {rules.hasCommander
                  ? 'Commander: 100 cards including your commander, one copy of each card, within its color identity.'
                  : `${rules.label}: at least ${rules.mainMin} cards, up to ${rules.copyLimit} copies of each card${rules.id === 'vintage' ? ' (1 if restricted)' : ''}, and a sideboard of up to ${rules.sideboardMax}. Search only shows ${rules.label}-legal cards.`}
              </p>
            </div>

            {/* Commander Selection */}
            {rules.hasCommander && (
            <div className="space-y-4">
              <CardSearchPanel
                commanderOnly
                label="Commander"
                placeholder="Find a legend..."
                onSelectCard={setCommander}
              />

              {deck.commander && (
                <div
                  {...previewProps(deck.commander)}
                  className="card card-side bg-base-100 border-2 border-primary/30 shadow-xl overflow-hidden"
                >
                  <div className="card-body p-4 flex-row items-center justify-between">
                    <div>
                      <h3 className="card-title text-md">
                        {deck.commander.name}
                      </h3>
                      <p className="text-xs opacity-60">
                        {deck.commander.type_line}
                      </p>
                      <CardPrice card={deck.commander} />
                    </div>
                    <div className="flex gap-1 bg-base-200 p-2 rounded-lg">
                      {deck.commander.color_identity.map((c) => (
                        <ColorPip key={c} color={c} size={22} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            )}

            {/* Partner Selection */}
            {rules.hasCommander && deck.commander && commanderHasPartner && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                <CardSearchPanel
                  commanderOnly
                  label={
                    requiredPartnerName
                      ? `Required Partner: ${requiredPartnerName}`
                      : 'Partner Commander'
                  }
                  placeholder={
                    requiredPartnerName
                      ? `Search ${requiredPartnerName}...`
                      : 'Search for a partner...'
                  }
                  onSelectCard={setPartner}
                />

                {partnerWarning && (
                  <div className="alert alert-error shadow-lg py-2">
                    <TriangleAlert />
                    <span className="text-sm">{partnerWarning}</span>
                    <button
                      onClick={clearPartnerWarning}
                      className="btn btn-ghost btn-xs"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {deck.partner && (
                  <div
                    {...previewProps(deck.partner)}
                    className="card card-side bg-base-100 border-2 border-primary/30 shadow-xl overflow-hidden"
                  >
                    <div className="card-body p-4 flex-row items-center justify-between">
                      <div>
                        <h3 className="card-title text-md">
                          {deck.partner.name}
                        </h3>
                        <p className="text-xs opacity-60">
                          {deck.partner.type_line}
                        </p>
                        <CardPrice card={deck.partner} />
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex gap-1 bg-base-200 p-2 rounded-lg">
                          {deck.partner.color_identity.map((c) => (
                            <ColorPip key={c} color={c} size={22} />
                          ))}
                        </div>
                        <button
                          onClick={() => {
                            hidePreview();
                            removePartner();
                          }}
                          className="btn btn-circle btn-ghost btn-xs text-error"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Card Addition */}
          {canAddCards && (
            <section className="space-y-4">
              {rules.sideboardMax > 0 && (
                <div className="join" role="group" aria-label="Add cards to">
                  {(
                    [
                      ['main', 'Main deck'],
                      ['side', `Sideboard (${sideCount}/${rules.sideboardMax})`],
                    ] as const
                  ).map(([z, text]) => (
                    <button
                      key={z}
                      type="button"
                      onClick={() => setZone(z)}
                      aria-pressed={activeZone === z}
                      className={`join-item btn btn-sm text-sm ${activeZone === z ? 'btn-primary' : 'btn-ghost bg-base-100'}`}
                    >
                      {text}
                    </button>
                  ))}
                </div>
              )}
              <CardSearchPanel
                format={rules.id}
                label={
                  rules.hasCommander
                    ? 'The 99'
                    : activeZone === 'side'
                      ? 'Add to sideboard'
                      : 'Add to main deck'
                }
                placeholder={`Search ${rules.label}-legal cards...`}
                disabled={searchFull}
                disabledLabel={
                  activeZone === 'side' ? 'Sideboard is full' : 'Max card limit reached'
                }
                onSelectCard={(card) => addCard(card, activeZone)}
              />

              {addWarning && (
                <div className={`alert ${warningTone(addWarning)} shadow-lg py-2`}>
                  <TriangleAlert />
                  <span className="text-sm">{addWarning.message}</span>
                  <button
                    onClick={clearAddWarning}
                    className="btn btn-ghost btn-xs"
                    aria-label="Dismiss"
                  >
                    <X size={15} />
                  </button>
                </div>
              )}

              <BasicLandsPanel
                deck={deck}
                onDeckChange={commitCards}
                disabled={mainFull}
              />
            </section>
          )}
        </div>

        {/* Stats: second on phones (above the decklist), a sticky right-hand
            column spanning both rows on desktop. */}
        <aside className="lg:col-start-2 lg:row-start-1 lg:row-span-2">
          <div className="lg:sticky lg:top-24">
            <DeckStatsPanel deck={deck} />
          </div>
        </aside>

        {/* Decklist: fills the main column under the builder controls. */}
        {canAddCards && (
          <div className="min-w-0 lg:col-start-1">
            <DeckEntryList deck={deck} onDeckChange={commitCards} />
          </div>
        )}
      </div>
      {preview}
      <ConfirmDelete
        open={!!pendingFormat}
        onClose={() => setPendingFormat(null)}
        onConfirm={() => {
          if (pendingFormat) setFormat(pendingFormat);
          setPendingFormat(null);
        }}
        title={`Switch to ${pendingFormat ? FORMATS[pendingFormat].label : ''}?`}
        message={formatSwitchMessage(deck, pendingFormat, pendingViolations)}
        confirmLabel="Switch format"
      />
    </PageShell>
    </CardPriceProvider>
  );
}

function warningTone(w: AddWarning) {
  switch (w.kind) {
    case 'illegal':
      return 'alert-error';
    case 'copies':
      return 'alert-info';
    default:
      return 'alert-warning';
  }
}

function formatSwitchMessage(
  deck: Deck,
  to: DeckFormat | null,
  violations: number,
): string {
  if (!to) return '';
  const rules = FORMATS[to];
  const parts: string[] = [];
  if (!rules.hasCommander && (deck.commander || deck.partner)) {
    parts.push('Your commander moves into the main deck.');
  }
  if (rules.hasCommander && !getRules(deck).hasCommander) {
    parts.push("You'll pick a commander next.");
  }
  parts.push(
    violations > 0
      ? `${violations} ${violations === 1 ? 'card breaks' : 'cards break'} ${rules.label} rules and will be flagged, not removed.`
      : 'No cards are removed.',
  );
  parts.push('You can switch back at any time.');
  return parts.join(' ');
}
