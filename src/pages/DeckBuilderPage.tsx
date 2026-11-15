// Modules
import { useNavigate, useParams } from 'react-router-dom';

// Hooks
import { useDeckBuilder } from '@/features/deckBuilder/hooks/useDeckBuilder';
import { useCardHoverPreview } from '@/hooks/useCardHoverPreview';

// Store
import { getDeckCardCount, getAllCardIdsInDeck } from '@/store/deckStore';

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

// Types
import type { Deck } from '@/types';

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
    colorWarning,
    partnerWarning,
    commanderHasPartner,
    requiredPartnerName,
    duplicateWarning,
    setName,
    setCommander,
    setPartner,
    removePartner,
    addCard,
    saveDeck,
    clearColorWarning,
    clearPartnerWarning,
    clearDuplicateWarning,
  } = useDeckBuilder(deckId);

  const { previewProps, hidePreview, preview } = useCardHoverPreview();

  const cardCount = getDeckCardCount(deck);
  const MAX_CARD_COUNT_REACHED = cardCount >= 100;

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
              <input
                type="text"
                value={deck.name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name your masterpiece..."
                className="input input-bordered input-lg w-full bg-base-100 font-bold focus:input-primary"
              />
            </div>

            {/* Commander Selection */}
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

            {/* Partner Selection */}
            {deck.commander && commanderHasPartner && (
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
          {deck.commander && (
            <section className="space-y-4">
              <CardSearchPanel
                label="The 99"
                placeholder="Search cards..."
                disabled={MAX_CARD_COUNT_REACHED}
                onSelectCard={addCard}
              />

              {colorWarning && (
                <div className="alert alert-warning shadow-lg py-2">
                  <TriangleAlert />
                  <span className="text-sm">{colorWarning}</span>
                  <button
                    onClick={clearColorWarning}
                    className="btn btn-ghost btn-xs"
                  >
                    <X size={15} />
                  </button>
                </div>
              )}
              {duplicateWarning && (
                <div className="alert alert-info shadow-lg py-2">
                  <TriangleAlert />
                  <span className="text-sm">{duplicateWarning}</span>
                  <button
                    onClick={clearDuplicateWarning}
                    className="btn btn-ghost btn-xs"
                  >
                    <X size={15} />
                  </button>
                </div>
              )}

              <BasicLandsPanel
                deck={deck}
                onDeckChange={commitCards}
                disabled={MAX_CARD_COUNT_REACHED}
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
        {deck.commander && (
          <div className="min-w-0 lg:col-start-1">
            <DeckEntryList deck={deck} onDeckChange={commitCards} />
          </div>
        )}
      </div>
      {preview}
    </PageShell>
    </CardPriceProvider>
  );
}
