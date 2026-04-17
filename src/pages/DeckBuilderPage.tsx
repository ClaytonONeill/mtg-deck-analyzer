// Modules
import { useNavigate, useParams } from "react-router-dom";

// Hooks
import { useDeckBuilder } from "@/features/deckBuilder/hooks/useDeckBuilder";

// Store
import { getDeckCardCount } from "@/store/deckStore";

// Components
import CardSearchPanel from "@/features/deckBuilder/components/CardSearchPanel";
import BasicLandsPanel from "@/features/deckBuilder/components/BasicLandsPanel";
import DeckEntryList from "@/features/deckBuilder/components/DeckEntryList";
import ColorPip from "@/components/ManaSymbol/ColorPip";
import ImportDeckButton from "@/components/ImportDeckButton/ImportDeckButton";

// Types
import type { Deck } from "@/types";

export default function DeckBuilderPage() {
  const { deckId } = useParams();
  const navigate = useNavigate();

  const {
    deck,
    setDeck,
    loading,
    colorWarning,
    partnerWarning,
    commanderHasPartner,
    requiredPartnerName,
    setName,
    setCommander,
    setPartner,
    removePartner,
    addCard,
    saveDeck,
    clearWarning,
    clearPartnerWarning,
  } = useDeckBuilder(deckId);

  const cardCount = getDeckCardCount(deck);
  const MAX_CARD_COUNT_REACHED = cardCount >= 100;

  const handleSave = async () => {
    if (await saveDeck()) navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-base-300 flex flex-col items-center justify-center gap-4">
        <span className="loading loading-ring loading-lg text-primary"></span>
        <p className="text-base-content/60 text-sm font-medium tracking-widest uppercase">
          Loading deck...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-300 text-base-content">
      {/* Navbar */}
      <header className="navbar bg-base-100 px-6 border-b border-base-content/10 sticky top-0 z-50 shadow-sm">
        <div className="flex-1">
          <button
            onClick={() => navigate("/")}
            className="btn btn-ghost btn-sm gap-2 normal-case"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Decks
          </button>
        </div>
        <div className="flex-none gap-3">
          {!deckId && (
            <ImportDeckButton
              onImported={(deck: Deck) => navigate(`/deck/${deck.id}`)}
            />
          )}
          <button
            onClick={handleSave}
            disabled={!deck.name.trim()}
            className="btn btn-success btn-sm px-6"
          >
            Save Deck
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
        <div className="flex flex-col gap-10">
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
                <div className="card card-side bg-base-100 border-2 border-primary/30 shadow-xl overflow-hidden">
                  <div className="card-body p-4 flex-row items-center justify-between">
                    <div>
                      <h3 className="card-title text-md">
                        {deck.commander.name}
                      </h3>
                      <p className="text-xs opacity-60">
                        {deck.commander.type_line}
                      </p>
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
                      : "Partner Commander"
                  }
                  placeholder={
                    requiredPartnerName
                      ? `Search ${requiredPartnerName}...`
                      : "Search for a partner..."
                  }
                  onSelectCard={setPartner}
                />

                {partnerWarning && (
                  <div className="alert alert-error shadow-lg py-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="stroke-current shrink-0 h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-xs">{partnerWarning}</span>
                    <button
                      onClick={clearPartnerWarning}
                      className="btn btn-ghost btn-xs"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {deck.partner && (
                  <div className="card card-side bg-base-100 border-2 border-primary/30 shadow-xl overflow-hidden">
                    <div className="card-body p-4 flex-row items-center justify-between">
                      <div>
                        <h3 className="card-title text-md">
                          {deck.partner.name}
                        </h3>
                        <p className="text-xs opacity-60">
                          {deck.partner.type_line}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex gap-1 bg-base-200 p-2 rounded-lg">
                          {deck.partner.color_identity.map((c) => (
                            <ColorPip key={c} color={c} size={22} />
                          ))}
                        </div>
                        <button
                          onClick={removePartner}
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
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="stroke-current shrink-0 h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <span className="text-xs">{colorWarning}</span>
                  <button
                    onClick={clearWarning}
                    className="btn btn-ghost btn-xs"
                  >
                    ✕
                  </button>
                </div>
              )}

              <BasicLandsPanel
                deck={deck}
                onDeckChange={setDeck}
                disabled={MAX_CARD_COUNT_REACHED}
              />
            </section>
          )}
        </div>

        {/* Sidebar Deck List */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-24 h-fit">
          <div className="stats shadow bg-base-100 border border-base-content/10">
            <div className="stat">
              <div className="stat-title uppercase text-[10px] font-black tracking-widest">
                Deck Capacity
              </div>
              <div
                className={`stat-value text-3xl ${cardCount === 100 ? "text-primary" : ""}`}
              >
                {cardCount}
                <span className="text-base-content/20 mx-1">/</span>100
              </div>
              <div className="stat-desc mt-2">
                <progress
                  className={`progress w-full ${cardCount === 100 ? "progress-primary" : "progress-secondary"}`}
                  value={cardCount}
                  max="100"
                ></progress>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 border border-base-content/10 overflow-hidden">
            <div className="p-4 bg-base-200/50 border-b border-base-content/5 flex justify-between items-center">
              <h2 className="text-[10px] font-black uppercase tracking-widest opacity-60">
                Current Decklist
              </h2>
            </div>

            <div className="p-2 space-y-1">
              {deck.commander && (
                <div className="flex flex-col gap-1 mb-4">
                  <div className="badge badge-primary badge-lg w-full justify-start gap-2 h-auto py-2 rounded-md">
                    <span className="text-[9px] font-black opacity-70">
                      CMD
                    </span>
                    <span className="text-xs truncate font-bold">
                      {deck.commander.name}
                    </span>
                  </div>
                  {deck.partner && (
                    <div className="badge badge-primary badge-lg w-full justify-start gap-2 h-auto py-2 rounded-md">
                      <span className="text-[9px] font-black opacity-70">
                        CMD
                      </span>
                      <span className="text-xs truncate font-bold">
                        {deck.partner.name}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                <DeckEntryList deck={deck} onDeckChange={setDeck} />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
