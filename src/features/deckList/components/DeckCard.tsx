// Store
import { getDeckCardCount } from '@/store/deckStore';

// Components
import ColorPip from '@/components/ManaSymbol/ColorPip';

// Types
import type { Deck, ScryfallCard } from '@/types';

// Utils
import { getCardImageUris } from '@/utils/cardImage';
import { manaGradient } from '@/utils/manaColors';

// Icons
import { X } from 'lucide-react';

interface DeckCardProps {
  deck: Deck;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: (deck: Deck) => void;
}

// Art-only crop reads far better as a banner than the full card's top third;
// fall back to the full card image for data without one.
function bannerImage(card: ScryfallCard | null | undefined) {
  const uris = getCardImageUris(card);
  return uris?.art_crop ?? uris?.normal;
}

export default function DeckCard({
  deck,
  onOpen,
  onEdit,
  onDelete,
}: DeckCardProps) {
  const cardCount = getDeckCardCount(deck);
  const complete = cardCount === 100;

  const art = [deck.commander, deck.partner]
    .map((c) => (c ? { name: c.name, src: bannerImage(c) } : null))
    .filter((a): a is { name: string; src: string } => !!a?.src);

  return (
    <div className="group card card-compact bg-base-200 border border-base-300 shadow-sm overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_12px_32px_-12px_color-mix(in_oklab,var(--color-primary)_45%,transparent)]">
      {/* Color identity strip */}
      <div
        aria-hidden
        className="h-1.5 w-full shrink-0"
        style={{ background: manaGradient(deck.colorIdentity) }}
      />

      {/* Commander art */}
      <figure
        className="relative h-44 w-full overflow-hidden shrink-0 m-0 cursor-pointer bg-base-300"
        onClick={onOpen}
      >
        {art.length > 0 ? (
          <div className="flex w-full h-full">
            {art.map((a) => (
              <img
                key={a.name}
                src={a.src}
                alt={a.name}
                loading="lazy"
                className="min-w-0 flex-1 h-full object-cover object-[center_30%] transition-transform duration-700 group-hover:scale-105"
              />
            ))}
          </div>
        ) : (
          <img
            src="/mtg-card-image-back.jpeg"
            alt=""
            className="w-full h-full object-cover opacity-40"
          />
        )}
        {/* Theme-aware fade into the card body */}
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-base-200" />
      </figure>

      {/* Content */}
      <div className="card-body pt-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="card-title font-display font-bold tracking-wide text-base-content text-lg leading-tight">
            {deck.name}
          </h3>
          <div className="flex gap-1 shrink-0 pt-0.5">
            {deck.colorIdentity.map((c) => (
              <ColorPip key={c} color={c} size={18} />
            ))}
          </div>
        </div>

        <p className="text-sm text-base-content/70 italic leading-snug">
          {deck.commander ? (
            <>
              {deck.commander.name}
              {deck.partner && <> &amp; {deck.partner.name}</>}
            </>
          ) : (
            'No commander chosen'
          )}
        </p>

        {/* Progress toward 100 */}
        <div className="flex items-center gap-2 mt-1">
          <progress
            className={`progress h-1.5 flex-1 ${complete ? 'progress-primary' : 'progress-secondary'}`}
            value={cardCount}
            max={100}
          />
          <span
            className={`text-xs md:text-sm font-mono tabular-nums ${complete ? 'text-primary font-bold' : 'text-base-content/60'}`}
          >
            {cardCount}/100
          </span>
        </div>

        {/* Actions */}
        <div className="card-actions flex-nowrap mt-auto pt-3">
          <button
            onClick={onOpen}
            className="btn btn-sm btn-primary flex-1"
          >
            View
          </button>
          <button
            onClick={onEdit}
            className="btn btn-sm btn-neutral flex-1"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(deck)}
            className="btn btn-sm btn-ghost text-base-content/50 hover:text-error hover:bg-error/10 px-3"
            aria-label="Delete Deck"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
