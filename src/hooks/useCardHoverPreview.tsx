// Modules
import { useCallback, useEffect, useState, type FocusEvent, type MouseEvent } from "react";

// Components
import CardImageTooltip from "@/components/CardImageTooltip/CardImageTooltip";

// Types
import type { ScryfallCard } from "@/types";

// Hover previews only make sense with a real pointer and room beside the list.
const PREVIEW_MEDIA = "(hover: hover) and (min-width: 1024px)";

type Hovered = { card: ScryfallCard; rect: DOMRect } | null;

/**
 * Card-image-on-hover for any list of cards.
 *
 *   const { previewProps, preview } = useCardHoverPreview();
 *   <li {...previewProps(card)}>…</li>
 *   {preview}
 *
 * Also responds to keyboard focus, and hides on scroll (the preview is placed
 * from the row's rect at hover time, so it would drift once the list moves).
 */
export function useCardHoverPreview() {
  const [hovered, setHovered] = useState<Hovered>(null);

  const show = useCallback(
    (card: ScryfallCard, e: MouseEvent<HTMLElement> | FocusEvent<HTMLElement>) => {
      if (!window.matchMedia(PREVIEW_MEDIA).matches) return;
      setHovered({ card, rect: e.currentTarget.getBoundingClientRect() });
    },
    [],
  );
  const hide = useCallback(() => setHovered(null), []);

  useEffect(() => {
    if (!hovered) return;
    window.addEventListener("scroll", hide, { capture: true, passive: true });
    return () => window.removeEventListener("scroll", hide, { capture: true });
  }, [hovered, hide]);

  const previewProps = useCallback(
    (card: ScryfallCard) => ({
      onMouseEnter: (e: MouseEvent<HTMLElement>) => show(card, e),
      onMouseLeave: hide,
      onFocus: (e: FocusEvent<HTMLElement>) => show(card, e),
      onBlur: hide,
    }),
    [show, hide],
  );

  return {
    previewProps,
    hidePreview: hide,
    preview: <CardImageTooltip card={hovered?.card ?? null} anchorRect={hovered?.rect ?? null} />,
  };
}
