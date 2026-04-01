// Modules
import { useNavigate, useParams } from "react-router-dom";

// Hooks
import { useDeckBuilder } from "@/features/deckBuilder/hooks/useDeckBuilder";

// Store
import { deckStore, getDeckCardCount } from "@/store/deckStore";

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
  const existing = deckId ? deckStore.getById(deckId) : undefined;

  const {
    deck,
    setDeck,
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
  } = useDeckBuilder(existing);

  const cardCount = getDeckCardCount(deck);

  const handleSave = () => {
    if (saveDeck()) navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className=" px-6 py-4 flex items-center justify-between">
        <button
          onClick={() => navigate("/")}
          className="text-slate-400 hover:text-white text-sm transition-colors hover:cursor-pointer"
        >
          ← Back
        </button>
        <div className="flex items-center gap-2">
          <ImportDeckButton
            onImported={(deck: Deck) => navigate(`/deck/${deck.id}`)}
          />
          <button
            onClick={handleSave}
            disabled={!deck.name.trim()}
            className="bg-[#19c25f] hover:bg-emerald-400 disabled:opacity-40 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors hover:cursor-pointer"
          >
            Save Deck
          </button>
        </div>
      </header>
      <h1 className="text-3xl font-bold text-white text-center m-4">
        {existing ? "Edit Deck" : "Build New Deck"}
      </h1>
      <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
        {/* Left — inputs */}
        <div className="flex flex-col gap-8">
          {/* Deck name */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-300">
              Deck Name
            </label>
            <input
              type="text"
              value={deck.name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name your deck..."
              className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-[#1971c2] transition-colors"
            />
          </div>

          {/* Commander search */}
          <div className="flex flex-col gap-3">
            <CardSearchPanel
              commanderOnly
              label="Commander"
              placeholder="Search for a commander..."
              onSelectCard={setCommander}
            />
            {deck.commander && (
              <div className="bg-slate-800 border border-[#1971c2] rounded-lg px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-white font-semibold">
                    {deck.commander.name}
                  </p>
                  <p className="text-slate-400 text-xs mt-0.5">
                    {deck.commander.type_line}
                  </p>
                </div>
                <div className="flex gap-1">
                  {deck.commander.color_identity.map((c) => (
                    <ColorPip key={c} color={c} size={20} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Partner search — only shown if commander has partner keyword */}
          {deck.commander && commanderHasPartner && (
            <div className="flex flex-col gap-3">
              <CardSearchPanel
                commanderOnly
                label={
                  requiredPartnerName
                    ? `Partner — must be ${requiredPartnerName}`
                    : "Partner Commander"
                }
                placeholder={
                  requiredPartnerName
                    ? `Search for ${requiredPartnerName}...`
                    : "Search for a partner commander..."
                }
                onSelectCard={setPartner}
              />

              {/* Partner warning */}
              {partnerWarning && (
                <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-4 py-3 flex items-center justify-between">
                  <span>{partnerWarning}</span>
                  <button
                    onClick={clearPartnerWarning}
                    className="text-red-400 hover:text-red-200 ml-4"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Selected partner */}
              {deck.partner && (
                <div className="bg-slate-800 border border-[#1971c2] rounded-lg px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-white font-semibold">
                      {deck.partner.name}
                    </p>
                    <p className="text-slate-400 text-xs mt-0.5">
                      {deck.partner.type_line}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      {deck.partner.color_identity.map((c) => (
                        <ColorPip key={c} color={c} size={20} />
                      ))}
                    </div>
                    <button
                      onClick={removePartner}
                      className="text-slate-500 hover:text-red-400 transition-colors text-xs"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Card search */}
          {deck.commander && (
            <div className="flex flex-col gap-3">
              <CardSearchPanel
                label="Add Cards"
                placeholder="Search for cards..."
                onSelectCard={addCard}
              />
              {colorWarning && (
                <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-lg px-4 py-3 flex items-center justify-between">
                  <span>{colorWarning}</span>
                  <button
                    onClick={clearWarning}
                    className="text-red-400 hover:text-red-200 ml-4"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Basic lands */}
          {deck.commander && (
            <BasicLandsPanel deck={deck} onDeckChange={setDeck} />
          )}
        </div>

        {/* Right — deck list */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
              Deck List
            </h2>
            <span
              className="text-sm font-mono"
              style={{ color: cardCount === 100 ? "#1971c2" : undefined }}
            >
              {cardCount} / 100
            </span>
          </div>

          {/* Commander(s) in sidebar */}
          {deck.commander && (
            <div className="flex flex-col gap-1">
              <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm flex items-center gap-2">
                <span className="text-slate-400 text-xs uppercase tracking-wider shrink-0">
                  CMD
                </span>
                <span className="text-white truncate">
                  {deck.commander.name}
                </span>
              </div>
              {deck.partner && (
                <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm flex items-center gap-2">
                  <span className="text-slate-400 text-xs uppercase tracking-wider shrink-0">
                    CMD
                  </span>
                  <span className="text-white truncate">
                    {deck.partner.name}
                  </span>
                </div>
              )}
            </div>
          )}

          <DeckEntryList deck={deck} onDeckChange={setDeck} />
        </div>
      </div>
    </div>
  );
}
