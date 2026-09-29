// Types
import type { ScryfallCardFace, ScryfallImageUris } from '@/types';

type CardWithImages = {
  image_uris?: Partial<ScryfallImageUris>;
  card_faces?: ScryfallCardFace[];
};

/**
 * Resolves a card's image URIs for the given face (front by default).
 * Double-faced cards (transform, modal DFC) have no top-level `image_uris` on
 * Scryfall — each face carries its own. Other multi-face layouts (split,
 * adventure, flip) share one printed image, so their faces have no
 * `image_uris` and this falls back to the card-level image.
 */
export function getCardImageUris(
  card: CardWithImages | null | undefined,
  face = 0,
): Partial<ScryfallImageUris> | undefined {
  if (!card) return undefined;
  return card.card_faces?.[face]?.image_uris ?? card.image_uris;
}

/** True when the card has a separately printed back face worth flipping to. */
export function isFlippableCard(card: CardWithImages | null | undefined) {
  return (card?.card_faces?.filter((f) => f.image_uris).length ?? 0) > 1;
}
