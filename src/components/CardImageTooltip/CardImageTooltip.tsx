// Modules
import { createPortal } from "react-dom";

// Components
import CardPrice from "@/components/CardPrice/CardPrice";

// Types
import type { ScryfallCard } from "@/types";

// Utils
import { getCardImageUris, isFlippableCard } from "@/utils/cardImage";

interface CardImageTooltipProps {
  card: ScryfallCard | null;
  anchorRect: DOMRect | null;
}

// Rendered size of one face, in px. Card images are 488x680 (~0.718).
const FACE_WIDTH = 240;
const FACE_HEIGHT = Math.round(FACE_WIDTH / 0.718);
const GAP = 12;
const EDGE = 8;

/**
 * Floating card image shown beside a hovered list row. Positioned with
 * `position: fixed` from the anchor's viewport rect, flipping to the anchor's
 * left when there isn't room on the right (e.g. the deck builder's sidebar
 * list) and clamped vertically so it never leaves the viewport. Double-faced
 * cards show both faces side by side.
 *
 * Prefer `useCardHoverPreview`, which owns the hover state and handlers.
 */
export default function CardImageTooltip({
  card,
  anchorRect,
}: CardImageTooltipProps) {
  if (!card || !anchorRect) return null;

  const front = getCardImageUris(card, 0)?.normal;
  if (!front) return null;
  const back = isFlippableCard(card) ? getCardImageUris(card, 1)?.normal : undefined;

  const width = back ? FACE_WIDTH * 2 + GAP : FACE_WIDTH;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const fitsRight = anchorRect.right + GAP + width + EDGE <= vw;
  const left = fitsRight
    ? anchorRect.right + GAP
    : Math.max(EDGE, anchorRect.left - GAP - width);
  const top = Math.min(
    Math.max(EDGE, anchorRect.top + anchorRect.height / 2 - FACE_HEIGHT / 2),
    vh - FACE_HEIGHT - EDGE,
  );

  return createPortal(
    // Always-on-top tier (docs/design-tokens.md §3): a hover preview must
    // never be occluded, including by an open search dropdown.
    <div
      className="fixed z-[1000] pointer-events-none flex animate-card-preview"
      style={{ top, left, gap: GAP }}
      aria-hidden
    >
      {[front, back].filter(Boolean).map((src, i) => (
        <div key={i} className="relative" style={{ width: FACE_WIDTH }}>
          <img
            src={src}
            alt=""
            width={FACE_WIDTH}
            height={FACE_HEIGHT}
            className="w-full rounded-[4.75%/3.5%] shadow-2xl ring-1 ring-black/40 bg-base-300"
          />
          {i === 0 && (
            <div className="absolute bottom-2 left-2 rounded-md bg-black/75 backdrop-blur-sm px-2 py-0.5">
              <CardPrice card={card} className="text-white" />
            </div>
          )}
        </div>
      ))}
    </div>,
    document.body,
  );
}
