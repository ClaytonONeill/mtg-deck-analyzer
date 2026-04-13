// Store
import { getDeckCardCount, exportDeck } from "@/store/deckStore";

// Components
import ColorPip from "@/components/ManaSymbol/ColorPip";

// Types
import type { Deck } from "@/types";

interface DeckCardProps {
  deck: Deck;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function DeckCard({
  deck,
  onOpen,
  onEdit,
  onDelete,
}: DeckCardProps) {
  const cardCount = getDeckCardCount(deck);

  const commanderImage = deck.commander?.image_uris?.normal;
  const partnerImage = deck.partner?.image_uris?.normal;
  const hasPartner = Boolean(deck.partner && partnerImage);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col hover:border-slate-600 transition-colors">
      {/* Image header  */}
      <div className="relative h-52 w-full overflow-hidden shrink-0">
        {hasPartner ? (
          <div className="flex w-full h-full">
            {/* Commander */}
            <div className="relative w-1/2 h-full overflow-hidden">
              <img
                src={commanderImage}
                alt={deck.commander?.name}
                className="w-full h-full object-cover object-top scale-105"
              />
            </div>

            {/* Partner */}
            <div className="relative w-1/2 h-full overflow-hidden">
              <img
                src={partnerImage}
                alt={deck.partner?.name}
                className="w-full h-full object-cover object-top scale-105"
              />
            </div>
          </div>
        ) : (
          <img
            src={commanderImage}
            alt={deck.commander?.name}
            className="w-full h-full object-cover object-top"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/30 to-slate-900" />
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col gap-4 flex-1">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-white text-lg leading-tight">
            {deck.name}
          </h3>
          <div className="flex gap-1 shrink-0">
            {deck.colorIdentity.map((c) => (
              <ColorPip key={c} color={c} size={18} />
            ))}
          </div>
        </div>

        {/* Meta */}
        <div className="text-sm text-slate-400 space-y-1">
          <p>
            <span className="text-slate-500">Commander: </span>
            {deck.commander ? (
              deck.commander.name
            ) : (
              <span className="italic">None set</span>
            )}
          </p>

          {deck.partner && (
            <p>
              <span className="text-slate-500">Partner: </span>
              {deck.partner.name}
            </p>
          )}

          <p>
            <span className="text-slate-500">Cards: </span>
            {cardCount} / 100
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-auto pt-2 border-t border-slate-800">
          <button
            onClick={onOpen}
            className="flex-1 text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg transition-colors"
          >
            View
          </button>
          <button
            onClick={onEdit}
            className="flex-1 text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => exportDeck(deck)}
            className="flex-1 text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg transition-colors"
          >
            Export
          </button>
          <button
            onClick={onDelete}
            className="text-sm font-semibold bg-slate-800 hover:bg-red-900 text-slate-400 hover:text-red-300 px-3 py-2 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
