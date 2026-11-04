// Modules
import { useState } from "react";

// Types
import type { ReactNode } from "react";
import type { ScryfallCard } from "@/types";
import type { RecInput } from "../utils/deckSignals";

// Hooks
import { useRecommendations, MAX_MORE_CLICKS } from "../hooks/useRecommendations";

// Icons
import { ExternalLink } from "lucide-react";

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
    basis,
    visible,
    loading,
    error,
    searchError,
    edhrec,
    mode,
    setMode,
    moreClicks,
    canShowMore,
    capped,
    showMore,
    retry,
  } = useRecommendations(input, excludeCards, target);
  const [zoomed, setZoomed] = useState<ScryfallCard | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xs md:text-sm uppercase font-black tracking-widest opacity-50">
            {title}
          </h2>
          <div className="join" role="group" aria-label="Suggestion style">
            {(
              [
                ["top", "Top picks"],
                ["gems", "Hidden gems"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={mode === value}
                onClick={() => setMode(value)}
                title={
                  value === "gems"
                    ? "Favors cards that fit this deck but few decks play yet"
                    : "The strongest fits for this commander and deck"
                }
                className={`join-item btn btn-xs text-xs md:btn-sm md:text-sm ${mode === value ? "btn-primary" : "btn-ghost bg-base-200"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs md:text-sm text-base-content/60">
          Based on: {basis.join(" · ")}
        </p>
        {edhrec.status === "ok" && edhrec.url && (
          <p className="text-xs md:text-sm text-base-content/50">
            Commander data from{" "}
            <a
              href={edhrec.url}
              target="_blank"
              rel="noreferrer"
              className="link link-hover inline-flex items-center gap-0.5"
            >
              EDHREC
              <ExternalLink size={12} className="shrink-0" />
            </a>
          </p>
        )}
        {edhrec.status === "missing" && (
          <p className="text-xs md:text-sm text-base-content/50">
            No EDHREC data for this commander yet; suggestions are based on
            your deck's cards and objectives.
          </p>
        )}
        {edhrec.status === "error" && (
          <p className="text-xs md:text-sm text-base-content/50">
            Couldn't reach EDHREC; suggestions are based on your deck's cards
            and objectives.{" "}
            <button type="button" onClick={retry} className="link link-hover">
              Retry
            </button>
          </p>
        )}
        {searchError && !error && (
          <p className="text-xs md:text-sm text-base-content/50">
            Some suggestions couldn't load ({searchError}).
          </p>
        )}
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
