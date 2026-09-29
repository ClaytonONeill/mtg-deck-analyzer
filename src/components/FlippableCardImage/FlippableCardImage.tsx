// Modules
import { useState, type MouseEvent } from 'react';

// Types
import type { ScryfallCardFace, ScryfallImageUris } from '@/types';

// Utils
import { getCardImageUris, isFlippableCard } from '@/utils/cardImage';

// Icons
import { RefreshCw } from 'lucide-react';

interface FlippableCardImageProps {
  card: {
    name: string;
    image_uris?: Partial<ScryfallImageUris>;
    card_faces?: ScryfallCardFace[];
  };
  /** Preferred image size; falls back to the next size down if missing. */
  size?: 'large' | 'normal' | 'small';
  /** Classes for the <img>. */
  className?: string;
  /** Classes for the positioning wrapper around the image + flip button. */
  wrapperClassName?: string;
  buttonSize?: 'sm' | 'md';
  onClick?: () => void;
  /**
   * Controlled face index. Omit to let the component track it internally —
   * in that case, give the component a `key` per card so the face resets
   * when the card changes.
   */
  face?: number;
  onFaceChange?: (face: number) => void;
}

const SIZE_FALLBACKS: Record<
  NonNullable<FlippableCardImageProps['size']>,
  (keyof ScryfallImageUris)[]
> = {
  large: ['large', 'normal', 'small'],
  normal: ['normal', 'large', 'small'],
  small: ['small', 'normal', 'large'],
};

/**
 * Card image with a flip button for double-faced cards. Single-faced cards
 * render as a plain image with no button.
 */
export default function FlippableCardImage({
  card,
  size = 'normal',
  className = '',
  wrapperClassName = '',
  buttonSize = 'sm',
  onClick,
  face: controlledFace,
  onFaceChange,
}: FlippableCardImageProps) {
  const [internalFace, setInternalFace] = useState(0);
  const flippable = isFlippableCard(card);
  const face = flippable ? (controlledFace ?? internalFace) : 0;

  const uris = getCardImageUris(card, face);
  const src = SIZE_FALLBACKS[size].map((s) => uris?.[s]).find(Boolean);
  const faceName = flippable ? (card.card_faces?.[face]?.name ?? card.name) : card.name;

  const flip = (e: MouseEvent) => {
    // The image underneath usually opens a zoom/select action — don't trigger it.
    e.stopPropagation();
    const next = face === 0 ? 1 : 0;
    setInternalFace(next);
    onFaceChange?.(next);
  };

  return (
    <div className={`relative ${wrapperClassName}`}>
      <img src={src} alt={faceName} onClick={onClick} className={className} />
      {flippable && (
        <button
          type="button"
          onClick={flip}
          aria-label={face === 0 ? `Show back face of ${card.name}` : `Show front face of ${card.name}`}
          title="Flip card"
          // Always visible (no hover on touch), with the tap target padded out
          // past the visible circle so it's easy to hit on a phone.
          className={`btn btn-circle ${buttonSize === 'md' ? 'btn-md bottom-4 right-4' : 'btn-sm bottom-3 right-3'} absolute bg-base-100/80 backdrop-blur-sm border-base-300 shadow-lg touch-manipulation after:absolute after:-inset-2`}
        >
          <RefreshCw
            className={`${buttonSize === 'md' ? 'size-5' : 'size-4'} transition-transform duration-300 ${face === 1 ? 'rotate-180' : ''}`}
          />
        </button>
      )}
    </div>
  );
}
