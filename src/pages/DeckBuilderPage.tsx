import { useNavigate, useParams } from "react-router-dom";
import { deckStore } from "@/store/deckStore";
import { useDeckBuilder } from "@/features/deckBuilder/hooks/useDeckBuilder";
import CardSearchPanel from "@/features/deckBuilder/components/CardSearchPanel";
import BasicLandsPanel from "@/features/deckBuilder/components/BasicLandsPanel";
import DeckEntryList from "@/features/deckBuilder/components/DeckEntryList";
import { getDeckCardCount } from "@/store/deckStore";

export default function DeckBuilderPage() {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const existing = deckId ? deckStore.getById(deckId) : undefined;

  const {
    deck,
    colorWarning,
    setName,
    setCommander,
    addCard,
    removeCard,
    saveDeck,
    clearWarning,
  } = useDeckBuilder(existing);

  const cardCount = getDeckCardCount(deck);

  const handleSave = () => {
    if (saveDeck()) navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <button
          onClick={() => navigate("/")}
          className="text-slate-400 hover:text-white text-sm transition-colors"
        >
          ← Back
        </button>
        <h1 className="text-lg font-bold text-white">
          {existing ? "Edit Deck" : "Build New Deck"}
        </h1>
        <button
          onClick={handleSave}
          disabled={!deck.name.trim()}
          className="bg-[#1971c2] hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          Save Deck
        </button>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
        {/* Left column — inputs */}
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

          {/* Commander */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <CardSearchPanel
                commanderOnly
                label="Commander"
                placeholder="Search for a commander..."
                onSelectCard={setCommander}
              />
            </div>
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
                  {deck.colorIdentity.map((c) => (
                    <span
                      key={c}
                      className="text-xs font-bold bg-slate-700 text-slate-200 px-2 py-0.5 rounded"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

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
            <BasicLandsPanel
              deck={deck}
              onDeckChange={(d) => {
                // sync deck state from BasicLandsPanel mutations
                Object.assign(deck, d);
                addCard(d.entries[d.entries.length - 1]?.card);
              }}
            />
          )}
        </div>

        {/* Right column — deck list */}
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

          {deck.commander && (
            <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm flex items-center gap-2">
              <span className="text-slate-400">CMD</span>
              <span className="text-white">{deck.commander.name}</span>
            </div>
          )}

          <DeckEntryList
            deck={deck}
            onDeckChange={(updatedDeck) => {
              // reflect removals back into hook state
              updatedDeck.entries.forEach((e) => {
                const existing = deck.entries.find(
                  (de) => de.card.id === e.card.id,
                );
                if (!existing) removeCard(e.card.id);
              });
            }}
          />
        </div>
      </div>
    </div>
  );
}
