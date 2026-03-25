import { createPortal } from "react-dom";
import { usePortal } from "@/hooks/usePortal";
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

  if (!card || !anchorRect || !card.image_uris?.normal) return null;

  const top = anchorRect.top + window.scrollY;
  const left = anchorRect.right + window.scrollX + 12;

  return createPortal(
    <div
      className="absolute z-[9999] pointer-events-none"
      style={{ top, left }}
    >
      <img
        src={card.image_uris.normal}
        alt={card.name}
        className="w-52 rounded-xl shadow-2xl border border-slate-700"
      />
    </div>,
    portal,
  );
}
