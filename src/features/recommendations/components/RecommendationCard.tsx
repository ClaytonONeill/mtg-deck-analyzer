// Types
import type { ReactNode } from "react";
import type { Recommendation } from "../utils/scryfallRecs";

// Components
import FlippableCardImage from "@/components/FlippableCardImage/FlippableCardImage";
import CardPrice from "@/components/CardPrice/CardPrice";
import ManaCost from "@/components/ManaSymbol/ManaCost";

const MAX_REASONS = 3;

interface RecommendationCardProps {
  rec: Recommendation;
  onZoom: () => void;
  /** Buttons under the card; differ between the deck tab and swap sidebar. */
  actions: ReactNode;
}

export default function RecommendationCard({
  rec,
  onZoom,
  actions,
}: RecommendationCardProps) {
  const { card, reasons } = rec;
  const extra = reasons.length - MAX_REASONS;

  return (
    <div className="flex flex-col gap-2 min-w-0">
      <FlippableCardImage
        key={card.id}
        card={card}
        size="normal"
        onClick={onZoom}
        className="w-full rounded-xl shadow-lg border border-base-300 cursor-zoom-in"
      />
      <div className="flex flex-col gap-1 min-w-0">
        <div className="flex items-start justify-between gap-1 min-w-0">
          <h3 className="text-sm font-bold truncate">{card.name}</h3>
          <span className="shrink-0 hidden sm:inline">
            <ManaCost
              cost={card.mana_cost || card.card_faces?.[0]?.mana_cost || ""}
              size={12}
            />
          </span>
        </div>
        <CardPrice card={card} className="text-xs" />
        <ul className="flex flex-wrap gap-1" aria-label="Why it's recommended">
          {reasons.slice(0, MAX_REASONS).map((reason) => (
            <li
              key={reason}
              className="badge badge-sm badge-ghost h-auto py-0.5 text-xs leading-tight text-left"
            >
              {reason}
            </li>
          ))}
          {extra > 0 && (
            <li
              className="badge badge-sm badge-ghost text-xs"
              title={reasons.slice(MAX_REASONS).join(", ")}
            >
              +{extra}
            </li>
          )}
        </ul>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-auto">{actions}</div>
    </div>
  );
}
