// Modules
import { useMemo } from "react";

// Store
import { removeCardFromDeck } from "@/store/deckStore";

// Hooks
import { useCardHoverPreview } from "@/hooks/useCardHoverPreview";
import { useLocalStorage } from "@/hooks/useLocalStorage";

// Components
import ManaCost from "@/components/ManaSymbol/ManaCost";

// Types
import type { CardCategory, Deck, DeckEntry, ScryfallCard } from "@/types";

// Utils
import { getCardImageUris } from "@/utils/cardImage";

// Icons
import { Layers, List, X } from "lucide-react";

const CATEGORY_ORDER: CardCategory[] = [
  "Creature",
  "Instant",
  "Sorcery",
  "Enchantment",
  "Artifact",
  "Planeswalker",
  "Land",
  "Other",
];

type View = "list" | "stacks";

interface Group {
  key: string;
  label: string;
  entries: DeckEntry[];
  /** Commanders can't be removed from here (they're set above). */
  locked?: boolean;
}

interface DeckEntryListProps {
  deck: Deck;
  onDeckChange: (deck: Deck) => void;
}

const byCurveThenName = (a: DeckEntry, b: DeckEntry) =>
  (a.card.cmc ?? 0) - (b.card.cmc ?? 0) || a.card.name.localeCompare(b.card.name);

/**
 * The deck, grouped by card type, in one of two views:
 * - **list**: compact rows flowed into 1–3 newspaper columns, so a full
 *   100-card deck fits on screen with little or no scrolling;
 * - **stacks**: overlapping card images per type (only each card's name bar
 *   shows), brought to the front on hover/focus.
 * Hovering a card shows the full image (desktop); the chosen view is
 * remembered per browser.
 */
export default function DeckEntryList({ deck, onDeckChange }: DeckEntryListProps) {
  const [view, setView] = useLocalStorage<View>("builder-deck-view", "list");
  const { previewProps, hidePreview, preview } = useCardHoverPreview();

  const groups = useMemo<Group[]>(() => {
    const commanders = [deck.commander, deck.partner]
      .filter((c): c is ScryfallCard => !!c)
      .map((card) => ({ card, quantity: 1, category: "Commander" }) as DeckEntry);

    const result: Group[] = [];
    if (commanders.length) {
      result.push({
        key: "Commander",
        label: commanders.length > 1 ? "Commanders" : "Commander",
        entries: commanders,
        locked: true,
      });
    }
    for (const cat of CATEGORY_ORDER) {
      const entries = deck.entries
        .filter((e) => e.category === cat)
        .sort(byCurveThenName);
      if (entries.length) result.push({ key: cat, label: cat, entries });
    }
    return result;
  }, [deck.commander, deck.partner, deck.entries]);

  const handleRemove = (cardId: string) => {
    hidePreview();
    onDeckChange(removeCardFromDeck(deck, cardId));
  };

  const total = (g: Group) => g.entries.reduce((s, e) => s + e.quantity, 0);
  const isEmpty = deck.entries.length === 0;

  return (
    <section className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-xl md:text-2xl font-bold tracking-wide">
          Decklist
        </h2>
        <div className="join" role="group" aria-label="Decklist view">
          {(
            [
              ["list", List, "List"],
              ["stacks", Layers, "Stacks"],
            ] as const
          ).map(([v, Icon, label]) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              aria-pressed={view === v}
              className={`join-item btn btn-sm text-sm gap-1.5 ${view === v ? "btn-primary" : "btn-ghost bg-base-100"}`}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>
      </div>

      {isEmpty && (
        <p className="text-sm md:text-base text-base-content/60 italic">
          No cards yet. Search above to start adding to the 99.
        </p>
      )}

      {view === "list" ? (
        <div className="columns-1 sm:columns-2 xl:columns-3 gap-6">
          {groups.map((g) => (
            <div key={g.key} className="break-inside-avoid mb-5">
              <GroupHeader label={g.label} count={total(g)} />
              <ul className="bg-base-100 rounded-lg border border-base-content/5 divide-y divide-base-content/5 overflow-hidden">
                {g.entries.map((entry) => (
                  <li
                    key={entry.card.id}
                    {...previewProps(entry.card)}
                    tabIndex={0}
                    className="group flex items-center gap-2 pl-3 pr-1 py-1.5 hover:bg-base-200/70 focus:bg-base-200/70 outline-none transition-colors"
                  >
                    <span className="w-6 shrink-0 text-xs md:text-sm font-mono opacity-50">
                      {entry.quantity > 1 ? `${entry.quantity}×` : ""}
                    </span>
                    <span
                      className={`flex-1 min-w-0 truncate text-sm ${g.locked ? "font-bold text-primary" : "font-medium"}`}
                    >
                      {entry.card.name}
                    </span>
                    <span className="shrink-0 opacity-80">
                      <ManaCost cost={entry.card.mana_cost} size={13} />
                    </span>
                    {g.locked ? (
                      <span className="w-7 shrink-0" />
                    ) : (
                      <RemoveButton
                        name={entry.card.name}
                        onClick={() => handleRemove(entry.card.id)}
                        className="md:opacity-0 group-hover:opacity-100 group-focus:opacity-100 focus:opacity-100"
                      />
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-x-3 gap-y-6">
          {groups.map((g) => (
            <div key={g.key} className="min-w-0">
              <GroupHeader label={g.label} count={total(g)} />
              <div className="flex flex-col">
                {g.entries.map((entry, i) => (
                  <StackCard
                    key={entry.card.id}
                    entry={entry}
                    last={i === g.entries.length - 1}
                    locked={g.locked}
                    previewProps={previewProps(entry.card)}
                    onRemove={() => handleRemove(entry.card.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {preview}
    </section>
  );
}

function GroupHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center justify-between px-1 mb-1.5">
      <h3 className="text-xs md:text-sm font-black uppercase tracking-widest opacity-60">
        {label}
      </h3>
      <span className="text-xs md:text-sm font-mono opacity-50">{count}</span>
    </div>
  );
}

function RemoveButton({
  name,
  onClick,
  className = "",
}: {
  name: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={`Remove ${name}`}
      className={`btn btn-ghost btn-sm btn-circle shrink-0 text-base-content/40 hover:text-error hover:bg-error/10 transition-opacity ${className}`}
    >
      <X size={15} />
    </button>
  );
}

/**
 * One card in a stack. Every card but the last reserves only a name-bar-high
 * slot; its full image overflows downward and is covered by the next card
 * (later DOM paints on top). Hover/focus lifts it above its neighbours so the
 * whole card shows — focus makes this work by tap on touch screens.
 */
function StackCard({
  entry,
  last,
  locked,
  previewProps,
  onRemove,
}: {
  entry: DeckEntry;
  last: boolean;
  locked?: boolean;
  previewProps: ReturnType<ReturnType<typeof useCardHoverPreview>["previewProps"]>;
  onRemove: () => void;
}) {
  const src = getCardImageUris(entry.card)?.normal;
  return (
    <div
      {...previewProps}
      tabIndex={0}
      className={`group relative outline-none hover:z-10 focus-within:z-10 ${last ? "aspect-[488/680]" : "aspect-[488/88]"}`}
    >
      <div className="absolute inset-x-0 top-0 aspect-[488/680] rounded-[4.75%/3.5%] overflow-hidden shadow-md ring-1 ring-black/30 bg-base-300 transition-transform duration-150 group-hover:-translate-y-1 group-focus-within:-translate-y-1 group-focus-within:ring-2 group-focus-within:ring-primary">
        {src ? (
          <img
            src={src}
            alt={entry.card.name}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="p-2 text-sm font-semibold">{entry.card.name}</div>
        )}
        {entry.quantity > 1 && (
          <span className="absolute top-[9%] right-1.5 badge badge-neutral text-xs md:text-sm font-bold shadow">
            ×{entry.quantity}
          </span>
        )}
        {!locked && (
          <div className="absolute top-[9%] left-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto transition-opacity">
            <RemoveButton
              name={entry.card.name}
              onClick={onRemove}
              className="btn-xs md:btn-sm bg-base-100/90 text-base-content hover:bg-error hover:text-error-content"
            />
          </div>
        )}
      </div>
    </div>
  );
}
