// Modules
import { useEffect, useState } from "react";

// Icons
import { ArrowDown, ArrowRight, Minus, Plus, X } from "lucide-react";

// Hooks
import { useCardHoverPreview } from "@/hooks/useCardHoverPreview";
import { useCardPrices } from "@/hooks/useCardPriceContext";

// Components
import CardPrice from "@/components/CardPrice/CardPrice";
import FlippableCardImage from "@/components/FlippableCardImage/FlippableCardImage";

// Utils
import { getCardImageUris } from "@/utils/cardImage";
import { getCardPriceValue } from "@/utils/priceUtils";

// Types
import type { DeckEntry } from "@/types";
import type { SwapGroup, SwapPair } from "../utils/compareUtils";

interface CompareSwapListProps {
  groups: SwapGroup[];
  baseLabel: string;
  targetLabel: string;
}

const SIDE_STYLE = {
  out: { border: "border-error", text: "text-error", Icon: Minus },
  in: { border: "border-success", text: "text-success", Icon: Plus },
} as const;

/**
 * The card-level changes between two compare sides, one row per out→in pair,
 * grouped by card type. Desktop shows the pair side by side; mobile stacks it
 * like a diff (red out over green in). Tapping a row opens both cards large.
 */
export default function CompareSwapList({
  groups,
  baseLabel,
  targetLabel,
}: CompareSwapListProps) {
  const { previewProps, hidePreview, preview } = useCardHoverPreview();
  const [zoomed, setZoomed] = useState<SwapPair | null>(null);

  return (
    <div className="flex flex-col gap-6">
      {/* Column headers (desktop only; mobile rows are self-labelled by color + icon) */}
      <div className="hidden sm:grid grid-cols-[minmax(0,1fr)_2.5rem_minmax(0,1fr)] gap-3 px-1">
        <span className="text-xs md:text-sm uppercase tracking-widest font-bold text-base-content/60 truncate">
          Out of {baseLabel}
        </span>
        <span />
        <span className="text-xs md:text-sm uppercase tracking-widest font-bold text-base-content/60 truncate">
          Into {targetLabel}
        </span>
      </div>

      {groups.map(({ category, pairs }) => (
        <section key={category} className="flex flex-col gap-3">
          <h3 className="flex items-baseline gap-2 border-b border-base-300 pb-1">
            <span className="text-sm md:text-base font-bold">{category}</span>
            <span className="text-xs md:text-sm text-base-content/60">
              {pairs.length} {pairs.length === 1 ? "change" : "changes"}
            </span>
          </h3>
          <ul className="flex flex-col gap-3">
            {pairs.map((pair, i) => (
              <li key={`${pair.out?.card.id ?? "none"}-${pair.in?.card.id ?? "none"}-${i}`}>
                <button
                  type="button"
                  onClick={() => {
                    hidePreview();
                    setZoomed(pair);
                  }}
                  className="w-full text-left grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_2.5rem_minmax(0,1fr)] gap-1 sm:gap-3 items-stretch rounded-box focus-visible:outline-2 focus-visible:outline-primary"
                  aria-label={describePair(pair)}
                >
                  <SwapSide entry={pair.out} kind="out" previewProps={previewProps} />
                  <PairArrow pair={pair} />
                  <SwapSide entry={pair.in} kind="in" previewProps={previewProps} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {preview}
      {zoomed && <PairModal pair={zoomed} onClose={() => setZoomed(null)} />}
    </div>
  );
}

function describePair(pair: SwapPair): string {
  if (pair.out && pair.in) return `${pair.out.card.name} swapped for ${pair.in.card.name}`;
  if (pair.out) return `${pair.out.card.name} removed`;
  return `${pair.in!.card.name} added`;
}

function SwapSide({
  entry,
  kind,
  previewProps,
}: {
  entry: DeckEntry | null;
  kind: "out" | "in";
  previewProps: ReturnType<typeof useCardHoverPreview>["previewProps"];
}) {
  const { border, text, Icon } = SIDE_STYLE[kind];

  if (!entry) {
    return (
      <div
        className={`flex items-center gap-2 rounded-box border border-dashed border-base-300 px-3 py-2 sm:py-0 text-sm md:text-base text-base-content/60 italic`}
      >
        <Icon size={16} className="shrink-0 opacity-60" aria-hidden />
        {kind === "out" ? "Nothing removed" : "Nothing added"}
      </div>
    );
  }

  const { card } = entry;
  const img = getCardImageUris(card)?.small;

  return (
    <div
      {...previewProps(card)}
      className={`flex items-center gap-3 rounded-box bg-base-100 border border-base-300 border-l-4 ${border} p-2 hover:bg-base-200 transition-colors min-w-0`}
    >
      {img ? (
        <img
          src={img}
          alt=""
          loading="lazy"
          className="w-12 md:w-14 aspect-[488/680] rounded-md shrink-0 bg-base-300"
        />
      ) : (
        <div className="w-12 md:w-14 aspect-[488/680] rounded-md shrink-0 bg-base-300" />
      )}
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="flex items-center gap-1.5 text-sm md:text-base font-semibold leading-snug">
          <Icon size={16} className={`shrink-0 ${text}`} aria-hidden />
          <span className="line-clamp-2">{card.name}</span>
        </span>
        <span className="text-xs md:text-sm text-base-content/70 truncate">
          {card.type_line}
          {entry.category !== "Land" && ` · MV ${card.cmc ?? 0}`}
        </span>
        <CardPrice card={card} />
      </div>
    </div>
  );
}

/** Desktop-only arrow between the two sides, with the pair's price change. */
function PairArrow({ pair }: { pair: SwapPair }) {
  const livePrices = useCardPrices();
  const price = (e: DeckEntry | null) =>
    e ? (getCardPriceValue(e.card, livePrices) ?? 0) : 0;
  const delta = price(pair.in) - price(pair.out);

  return (
    <div className="hidden sm:flex flex-col items-center justify-center gap-1 text-base-content/60">
      <ArrowRight size={20} aria-hidden />
      {Math.abs(delta) >= 0.01 && (
        <span className="text-xs md:text-sm font-mono whitespace-nowrap">
          {delta > 0 ? "+" : "−"}${Math.abs(delta).toFixed(2)}
        </span>
      )}
    </div>
  );
}

/** Both cards of a pair at readable size. Stacks on narrow phones. */
function PairModal({ pair, onClose }: { pair: SwapPair; onClose: () => void }) {
  const sides = [
    { entry: pair.out, label: "Out", cls: "text-error" },
    { entry: pair.in, label: "In", cls: "text-success" },
  ].filter((s) => s.entry);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <dialog open className="modal modal-open" onClose={onClose}>
      <div className="modal-box max-w-2xl bg-base-200">
        <button
          type="button"
          onClick={onClose}
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
          aria-label="Close"
        >
          <X size={18} />
        </button>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
          {sides.map(({ entry, label, cls }, i) => (
            <div key={label} className="contents">
              {i === 1 && (
                <>
                  <ArrowRight size={24} className="hidden sm:block shrink-0 opacity-60" aria-hidden />
                  <ArrowDown size={24} className="sm:hidden shrink-0 opacity-60" aria-hidden />
                </>
              )}
              <figure className="flex flex-col items-center gap-2 w-full max-w-60">
                <figcaption className={`text-sm md:text-base font-bold ${cls}`}>
                  {label}: {entry!.card.name}
                </figcaption>
                <FlippableCardImage
                  key={entry!.card.id}
                  card={entry!.card}
                  size="normal"
                  className="w-full rounded-[4.75%/3.5%] shadow-xl"
                />
                <CardPrice card={entry!.card} />
              </figure>
            </div>
          ))}
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="button" onClick={onClose}>
          close
        </button>
      </form>
    </dialog>
  );
}
