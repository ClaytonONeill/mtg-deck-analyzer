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
    <div className="card card-compact bg-base-200 border border-base-300 shadow-sm transition-colors rounded-t-3xl">
      {/* Image header  */}
      <figure className="relative h-52 w-full overflow-hidden shrink-0 m-0">
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
        {/* Theme-aware gradient overlay matching the bg-base-200 card background */}
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-base-200/30 to-base-200" />
      </figure>

      {/* Content */}
      <div className="card-body">
        {/* Top row */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="card-title text-base-content text-lg leading-tight">
            {deck.name}
          </h3>
          <div className="flex gap-1 shrink-0">
            {deck.colorIdentity.map((c) => (
              <ColorPip key={c} color={c} size={18} />
            ))}
          </div>
        </div>

        {/* Meta */}
        <div className="text-sm text-base-content/70 space-y-1">
          <p>
            <span className="opacity-70">Commander: </span>
            {deck.commander ? (
              deck.commander.name
            ) : (
              <span className="italic">None set</span>
            )}
          </p>

          {deck.partner && (
            <p>
              <span className="opacity-70">Partner: </span>
              {deck.partner.name}
            </p>
          )}

          <p>
            <span className="opacity-70">Cards: </span>
            {cardCount} / 100
          </p>
        </div>

        {/* Actions */}
        <div className="card-actions flex-nowrap mt-auto pt-4">
          <button
            onClick={onOpen}
            className="btn btn-sm btn-neutral flex-1 hover:border-primary/50"
          >
            View
          </button>
          <button
            onClick={onEdit}
            className="btn btn-sm btn-neutral flex-1 hover:border-primary/50"
          >
            Edit
          </button>
          <button
            onClick={() => exportDeck(deck)}
            className="btn btn-sm btn-neutral flex-1 hover:border-primary/50"
          >
            Export
          </button>
          <button
            onClick={onDelete}
            className="btn btn-sm btn-outline btn-error px-3"
            aria-label="Delete Deck"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
