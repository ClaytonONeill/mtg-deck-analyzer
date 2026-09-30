// Modules
import { useState } from "react";

// Types
import type { ReactNode } from "react";
import type { ScryfallCard } from "@/types";
import type { RecInput } from "../utils/deckSignals";

// Hooks
import { useRecommendations, MAX_MORE_CLICKS } from "../hooks/useRecommendations";

// Components
import RecommendationCard from "./RecommendationCard";
import FlippableCardImage from "@/components/FlippableCardImage/FlippableCardImage";

interface RecommendationsPanelProps {
  input: RecInput;
  /** Cards already in the deck (incl. pending-swap additions) to leave out. */
  excludeCards: ScryfallCard[];
  /** Set to suggest replacements for this card instead of for the deck. */
  target?: ScryfallCard | null;
  title: string;
  renderActions: (card: ScryfallCard) => ReactNode;
}

export default function RecommendationsPanel({
  input,
  excludeCards,
  target = null,
  title,
  renderActions,
}: RecommendationsPanelProps) {
  const {
    plan,
    visible,
    loading,
    error,
    moreClicks,
    canShowMore,
    capped,
    showMore,
    retry,
  } = useRecommendations(input, excludeCards, target);
  const [zoomed, setZoomed] = useState<ScryfallCard | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-xs md:text-sm uppercase font-black tracking-widest opacity-50">
          {title}
        </h2>
        <p className="text-xs text-base-content/60">
          Based on:{" "}
          {[...plan.signals.map((s) => s.label), ...plan.constraintReasons].join(
            " · ",
          )}
        </p>
      </div>

      {loading && (
        <div className="flex flex-col gap-3 items-center justify-center py-16">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="text-base-content/70 text-sm font-semibold">
            Finding suggestions...
          </p>
        </div>
      )}

      {error && (
        <div className="flex flex-col gap-3 items-center py-12 text-center">
          <p className="text-error text-sm font-semibold">{error}</p>
          <button type="button" onClick={retry} className="btn btn-sm btn-outline">
            Try again
          </button>
        </div>
      )}

      {!loading && !error && visible.length === 0 && (
        <p className="text-sm text-base-content/60 text-center py-12">
          No suggestions found for this deck.
        </p>
      )}

      {visible.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {visible.map((rec) => (
            <RecommendationCard
              key={rec.card.id}
              rec={rec}
              onZoom={() => setZoomed(rec.card)}
              actions={renderActions(rec.card)}
            />
          ))}
        </div>
      )}

      {canShowMore && (
        <button
          type="button"
          onClick={showMore}
          className="btn btn-outline w-full sm:w-auto sm:self-center"
        >
          Show more ({MAX_MORE_CLICKS - moreClicks} left)
        </button>
      )}
      {capped && (
        <p className="text-xs text-base-content/50 text-center">
          That's the strongest set; beyond this, suggestions get noisy.
        </p>
      )}

      {/* Tap-to-zoom, mainly for reading card text on mobile's 2-column grid */}
      {zoomed && (
        <div
          className="modal modal-open modal-bottom sm:modal-middle"
          onClick={() => setZoomed(null)}
        >
          <div
            className="modal-box p-0 bg-transparent shadow-none w-auto max-w-none flex justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <FlippableCardImage
              key={zoomed.id}
              card={zoomed}
              size="large"
              buttonSize="md"
              onClick={() => setZoomed(null)}
              className="max-h-[80vh] w-auto rounded-[3%] shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
