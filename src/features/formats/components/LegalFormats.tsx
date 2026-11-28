// Modules
import { useMemo } from "react";

// Hooks
import { useCardLegalities } from "@/hooks/useCardPriceContext";

// Utils
import {
  FORMATS,
  getFormat,
  getLegalFormats,
  type FormatLegality,
} from "@/features/formats/formats";

// Types
import type { Deck } from "@/types";

interface LegalFormatsProps {
  deck: Deck;
  /** `compact`: Home deck card. `detailed`: deck page, with reasons. */
  variant?: "compact" | "detailed";
}

const statusText: Record<FormatLegality["status"], string> = {
  legal: "Legal",
  incomplete: "Cards legal, deck not finished",
  illegal: "Not legal",
};

/** The deck's own format, highlighted. */
export function FormatBadge({ deck }: { deck: Deck }) {
  return (
    <span className="badge badge-primary badge-outline font-bold text-xs md:text-sm h-auto py-0.5">
      {FORMATS[getFormat(deck)].label}
    </span>
  );
}

/**
 * Every *other* format this deck is legal in. Solid: legal now. Outlined:
 * every card is legal there but the deck is short of that format's size.
 * `detailed` lists every format, including why the illegal ones fail.
 * Inside a `CardPriceProvider` it uses live legalities; elsewhere (Home) the
 * snapshots saved on each card.
 */
export default function LegalFormats({
  deck,
  variant = "compact",
}: LegalFormatsProps) {
  const live = useCardLegalities();
  const results = useMemo(() => getLegalFormats(deck, live), [deck, live]);
  const own = getFormat(deck);
  const others = results.filter(
    (r) => r.format !== own && r.status !== "illegal",
  );

  if (variant === "compact") {
    const hasCards = deck.entries.length > 0 || !!deck.commander;
    if (!hasCards || others.length === 0) return null;
    return (
      <div className="flex flex-wrap items-center gap-1" aria-label="Also legal in">
        <span className="text-xs md:text-sm text-base-content/50">Also legal in</span>
        {others.map((r) => (
          <span
            key={r.format}
            title={r.status === "legal" ? "Legal" : r.reasons.join("; ")}
            className={`badge text-xs md:text-sm h-auto py-0.5 ${r.status === "legal" ? "badge-neutral" : "badge-ghost badge-outline"}`}
          >
            {FORMATS[r.format].label}
          </span>
        ))}
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
      {results.map((r) => (
        <li key={r.format} className="flex items-start gap-2 text-sm md:text-base min-w-0">
          <span
            aria-hidden
            className={`mt-1.5 h-2.5 w-2.5 rounded-full shrink-0 ${r.status === "legal" ? "bg-success" : r.status === "incomplete" ? "border-2 border-success" : "bg-error/70"}`}
          />
          <span className="min-w-0">
            <span className={`font-semibold ${r.format === own ? "text-primary" : ""}`}>
              {FORMATS[r.format].label}
            </span>
            <span className="text-base-content/60">
              {" "}
              — {statusText[r.status]}
              {r.reasons.length > 0 && `: ${r.reasons.join("; ")}`}
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}
