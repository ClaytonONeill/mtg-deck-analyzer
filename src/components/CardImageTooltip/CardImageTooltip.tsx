// Modules
import { createPortal } from "react-dom";

// Hooks
import { usePortal } from "@/hooks/usePortal";

// Components
import CardPrice from "@/components/CardPrice/CardPrice";

// Types
import type { ScryfallCard } from "@/types";

interface CardImageTooltipProps {
  card: ScryfallCard | null;
  anchorRect: DOMRect | null;
}

export default function CardImageTooltip({
  card,
  anchorRect,
}: CardImageTooltipProps) {
  const portal = usePortal();

  // Minimum screen size (in px) to allow card image tooltip to display
  const MIN_SCREEN_SIZE = 1020;

  // Disable on small screens — tooltip renders off-screen and hover
  // doesn't work reliably on touch devices anyway
  if (typeof window !== "undefined" && window.innerWidth < MIN_SCREEN_SIZE)
    return null;

  if (!card || !anchorRect || !card.image_uris?.normal) return null;

  const top = anchorRect.top + window.scrollY;
  const left = anchorRect.right + window.scrollX + 12;

  return createPortal(
    <div
      className="absolute z-[9999] pointer-events-none"
      style={{ top, left }}
    >
      <div className="relative">
        <img
          src={card.image_uris.normal}
          alt={card.name}
          className="w-52 rounded-xl shadow-2xl border border-slate-700"
        />
        <div className="absolute bottom-0 inset-x-0 bg-black/70 backdrop-blur-sm rounded-b-xl px-3 py-1.5">
          <CardPrice card={card} className="text-white" />
        </div>
      </div>
    </div>,
    portal,
  );
}
