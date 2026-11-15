// Modules
import { useMemo } from "react";

// Hooks
import { useCardPrices } from "@/hooks/useCardPriceContext";
import { useLocalStorage } from "@/hooks/useLocalStorage";

// Store
import { getDeckCardCount } from "@/store/deckStore";

// Utils
import { roleCounts } from "@/features/recommendations/utils/deckSignals";
import { getCardPriceValue } from "@/utils/priceUtils";

// Types
import type { Deck, ScryfallCard } from "@/types";

// Icons
import { Check, ChevronDown } from "lucide-react";

interface DeckStatsPanelProps {
  deck: Deck;
}

// Curve buckets: 0–6 individually, then 7+.
const CURVE_BUCKETS = ["0", "1", "2", "3", "4", "5", "6", "7+"];

// Common Commander guidance: most 100-card decks run ~36–38 lands, and
// anything far outside 33–40 is usually a mistake rather than a plan.
const LANDS_LOW = 33;
const LANDS_HIGH = 40;

/**
 * Live "deck at a glance" for the builder sidebar: capacity, mana curve,
 * land count, average mana value, total price, and the staple roles (same
 * detection as the Suggestions tab). Commanders count toward capacity and
 * price, but not the curve or roles, matching how players read a curve.
 */
export default function DeckStatsPanel({ deck }: DeckStatsPanelProps) {
  const livePrices = useCardPrices();
  // Collapsible so the decklist below can have the whole sidebar when wanted.
  const [open, setOpen] = useLocalStorage("builder-stats-open", true);
  const cardCount = getDeckCardCount(deck);

  const stats = useMemo(() => {
    const curve = CURVE_BUCKETS.map(() => 0);
    let lands = 0;
    let spells = 0;
    let mvTotal = 0;

    for (const e of deck.entries) {
      if (e.category === "Land") {
        lands += e.quantity;
        continue;
      }
      const mv = Math.max(0, Math.floor(e.card.cmc ?? 0));
      curve[Math.min(mv, 7)] += e.quantity;
      spells += e.quantity;
      mvTotal += mv * e.quantity;
    }

    return {
      curve,
      curveMax: Math.max(1, ...curve),
      lands,
      avgMv: spells ? mvTotal / spells : 0,
      roles: roleCounts(deck.entries),
    };
  }, [deck.entries]);

  // Separate memo: live prices arrive after the deck does.
  const price = useMemo(() => {
    let total = 0;
    let unpriced = 0;
    const add = (card: ScryfallCard, qty: number) => {
      const v = getCardPriceValue(card, livePrices);
      // Basic lands are hand-built with no price data and cost next to
      // nothing, so they don't count as "unpriced".
      if (v === null) {
        if (!card.type_line?.startsWith("Basic Land")) unpriced += qty;
      }
      else total += v * qty;
    };
    if (deck.commander) add(deck.commander, 1);
    if (deck.partner) add(deck.partner, 1);
    for (const e of deck.entries) add(e.card, e.quantity);
    return { total, unpriced };
  }, [deck.commander, deck.partner, deck.entries, livePrices]);

  const complete = cardCount === 100;
  const landsInRange = stats.lands >= LANDS_LOW && stats.lands <= LANDS_HIGH;

  return (
    <div className="card shrink-0 bg-base-100 border border-base-content/10 overflow-hidden">
      {/* Capacity */}
      <div className="p-4 pb-3 space-y-2">
        <div className="flex items-baseline justify-between">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="flex items-center gap-1 text-xs md:text-sm font-black uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity"
          >
            Deck at a Glance
            <ChevronDown
              size={16}
              className={`transition-transform ${open ? "" : "-rotate-90"}`}
            />
          </button>
          <span
            className={`font-display text-2xl font-bold tabular-nums ${complete ? "text-primary" : ""}`}
          >
            {cardCount}
            <span className="text-base-content/30 text-lg mx-0.5">/</span>
            <span className="text-lg">100</span>
          </span>
        </div>
        <progress
          className={`progress h-1.5 w-full ${complete ? "progress-primary" : "progress-secondary"}`}
          value={cardCount}
          max={100}
        />
      </div>

      {open && (
      <>
      {/* Mana curve */}
      <div className="px-4 pb-4">
        <div className="text-xs md:text-sm font-semibold opacity-60 mb-2">
          Mana curve <span className="font-normal opacity-70">(nonland)</span>
        </div>
        <div
          className="grid grid-cols-8 gap-1 items-end h-24"
          role="img"
          aria-label={`Mana curve: ${CURVE_BUCKETS.map((b, i) => `${stats.curve[i]} at ${b}`).join(", ")}`}
        >
          {stats.curve.map((n, i) => (
            <div key={i} className="flex flex-col items-center justify-end h-full gap-0.5">
              <span className="text-xs md:text-sm font-mono tabular-nums opacity-70 leading-none">
                {n > 0 ? n : ""}
              </span>
              <div
                className="w-full rounded-t-sm bg-linear-to-t from-primary/60 to-primary transition-[height] duration-300 ease-out"
                style={{ height: `${(n / stats.curveMax) * 100}%`, minHeight: n ? 3 : 0 }}
              />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-8 gap-1 mt-1 border-t border-base-content/10 pt-1">
          {CURVE_BUCKETS.map((b) => (
            <span key={b} className="text-center text-xs md:text-sm font-mono opacity-50">
              {b}
            </span>
          ))}
        </div>
      </div>

      {/* Key numbers */}
      <div className="grid grid-cols-3 border-y border-base-content/10 divide-x divide-base-content/10 bg-base-200/40">
        <Stat
          label="Lands"
          value={String(stats.lands)}
          hint={landsInRange ? "on target" : "36–38 typical"}
          tone={stats.lands === 0 ? "muted" : landsInRange ? "good" : "warn"}
        />
        <Stat label="Avg MV" value={stats.avgMv ? stats.avgMv.toFixed(2) : "—"} hint="nonland" />
        <Stat
          label="Price"
          value={`$${price.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          hint={price.unpriced ? `${price.unpriced} unpriced` : "TCGplayer"}
        />
      </div>

      {/* Staple roles */}
      <ul className="p-4 space-y-2.5">
        {stats.roles.map((r) => {
          const met = r.count >= r.target;
          return (
            <li key={r.id} className="space-y-1">
              <div className="flex items-center justify-between text-xs md:text-sm">
                <span className="font-semibold flex items-center gap-1">
                  {r.name}
                  {met && <Check size={14} className="text-success" aria-label="target met" />}
                </span>
                <span className="font-mono tabular-nums opacity-70">
                  {r.count}
                  <span className="opacity-50">/{r.target}</span>
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-base-300 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-[width] duration-300 ${met ? "bg-success" : "bg-secondary"}`}
                  style={{ width: `${Math.min(r.count / r.target, 1) * 100}%` }}
                />
              </div>
            </li>
          );
        })}
        <li className="text-xs md:text-sm opacity-50 pt-1">
          Detected from card text. Targets are rough Commander norms.
        </li>
      </ul>
      </>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "good" | "warn" | "muted";
}) {
  const color =
    tone === "good" ? "text-success" : tone === "warn" ? "text-warning" : "";
  return (
    <div className="px-2 py-3 text-center min-w-0">
      <div className="text-xs md:text-sm uppercase tracking-wider font-bold opacity-50">
        {label}
      </div>
      <div className={`text-xl font-bold tabular-nums truncate ${color}`}>{value}</div>
      <div className="text-xs md:text-sm opacity-50 truncate">{hint}</div>
    </div>
  );
}
