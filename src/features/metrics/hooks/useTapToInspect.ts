// Modules
import { useState, useEffect, useRef } from "react";

// Hooks
import { useChartSelection } from "./useChartSelection";

const NO_HOVER_QUERY = "(hover: none)";

/**
 * Touch devices can't hover, so a single tap used to both show the tooltip and
 * open the category modal, and the tooltip was hard to dismiss afterwards.
 * On touch devices this splits it into two steps: the first tap on a category
 * "inspects" it (tooltip only), a second tap on the same category (or the
 * "View cards" action) opens the modal, and tapping outside the chart clears it.
 * Desktop behavior is unchanged: bar click opens the modal, hover shows tooltips.
 */
export function useTapToInspect() {
  const { setSelectedCategory } = useChartSelection();
  const [isTouch] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia?.(NO_HOVER_QUERY).matches === true,
  );
  const [inspected, setInspected] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isTouch || inspected === null) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setInspected(null);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isTouch, inspected]);

  /** Wire to each Bar's onClick — desktop only. */
  const handleBarClick = (category: string) => {
    if (!isTouch) setSelectedCategory(category);
  };

  /** Wire to the chart's onClick with the tapped band's label — touch only. */
  const handleChartTap = (category: string | undefined) => {
    if (!isTouch || category === undefined) return;
    if (inspected === category) {
      setSelectedCategory(category);
      setInspected(null);
    } else {
      setInspected(category);
    }
  };

  const openInspected = () => {
    if (inspected === null) return;
    setSelectedCategory(inspected);
    setInspected(null);
  };

  return {
    isTouch,
    inspected,
    containerRef,
    /** Pass to <Tooltip active>; undefined leaves desktop hover untouched. */
    tooltipActive: isTouch ? inspected !== null : undefined,
    handleBarClick,
    handleChartTap,
    openInspected,
    clearInspected: () => setInspected(null),
  };
}
