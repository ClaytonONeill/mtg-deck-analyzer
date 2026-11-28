// Modules
import { useMemo } from "react";

// Store
import {
  addCardToDeck,
  moveCardBetweenZones,
  removeCardFromDeck,
} from "@/store/deckStore";

// Hooks
import { useCardHoverPreview } from "@/hooks/useCardHoverPreview";
import { useCardLegalities } from "@/hooks/useCardPriceContext";
import { useLocalStorage } from "@/hooks/useLocalStorage";

// Components
import ManaCost from "@/components/ManaSymbol/ManaCost";

// Utils
import { getCardImageUris } from "@/utils/cardImage";
import {
  checkCardAdd,
  getDeckViolations,
  getRules,
  getSideboardCount,
  maxCopies,
  type Violation,
} from "@/features/formats/formats";

// Types
import type {
  CardCategory,
  Deck,
  DeckEntry,
  DeckZone,
  ScryfallCard,
} from "@/types";

// Icons
import {
  ArrowDownToLine,
  ArrowUpToLine,
  Layers,
  List,
  Minus,
  Plus,
  TriangleAlert,
} from "lucide-react";

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
  zone: DeckZone;
  /** Commanders can't be changed from here (they're set above). */
  locked?: boolean;
}

interface DeckEntryListProps {
  deck: Deck;
  onDeckChange: (deck: Deck) => void;
}

const byCurveThenName = (a: DeckEntry, b: DeckEntry) =>
  (a.card.cmc ?? 0) - (b.card.cmc ?? 0) || a.card.name.localeCompare(b.card.name);

/** What a row's buttons do, worked out once per row. */
interface RowActions {
  onAdd: () => void;
  /** False when the card can never have more than one copy (Commander
   * singletons), so a permanently disabled + isn't shown. */
  showAdd: boolean;
  /** Why another copy can't be added, or null if it can. */
  addBlocked: string | null;
  onRemove: () => void;
  /** Absent in Commander, which has no sideboard. */
  onMove?: () => void;
  zone: DeckZone;
}

/**
 * The deck, grouped by card type, in one of two views:
 * - **list**: compact rows flowed into 1–3 newspaper columns, so a full
 *   100-card deck fits on screen with little or no scrolling;
 * - **stacks**: overlapping card images per type (only each card's name bar
 *   shows), brought to the front on hover/focus.
 * A sideboard group follows the main deck in 60-card formats. Cards that
 * break the format's rules (e.g. after a format switch) are flagged, not
 * removed. Hovering a card shows the full image (desktop); the chosen view
 * is remembered per browser.
 */
export default function DeckEntryList({ deck, onDeckChange }: DeckEntryListProps) {
  const [view, setView] = useLocalStorage<View>("builder-deck-view", "list");
  const { previewProps, hidePreview, preview } = useCardHoverPreview();
  const live = useCardLegalities();
  const rules = getRules(deck);
  const sideboard = useMemo(() => deck.sideboard ?? [], [deck.sideboard]);

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
        zone: "main",
        locked: true,
      });
    }
    for (const cat of CATEGORY_ORDER) {
      const entries = deck.entries
        .filter((e) => e.category === cat)
        .sort(byCurveThenName);
      if (entries.length) {
        result.push({ key: cat, label: cat, entries, zone: "main" });
      }
    }
    if (sideboard.length) {
      result.push({
        key: "Sideboard",
        label: `Sideboard`,
        entries: [...sideboard].sort(byCurveThenName),
        zone: "side",
      });
    }
    return result;
  }, [deck.commander, deck.partner, deck.entries, sideboard]);

  const violations = useMemo(() => getDeckViolations(deck, live), [deck, live]);
  const violationsByName = useMemo(() => {
    const map = new Map<string, Violation[]>();
    for (const v of violations) {
      if (!v.cardName) continue;
      map.set(v.cardName, [...(map.get(v.cardName) ?? []), v]);
    }
    return map;
  }, [violations]);
  const deckIssues = violations.filter((v) => !v.cardName);

  const actionsFor = (entry: DeckEntry, zone: DeckZone): RowActions => {
    const check = checkCardAdd(deck, entry.card, zone, { live });
    return {
      zone,
      showAdd: maxCopies(rules.id, entry.card, live) > 1,
      addBlocked: check.ok ? null : check.reason,
      onAdd: () => {
        if (check.ok) onDeckChange(addCardToDeck(deck, entry.card, zone));
      },
      onRemove: () => {
        hidePreview();
        onDeckChange(removeCardFromDeck(deck, entry.card.id, zone));
      },
      // Moving to a full sideboard is blocked; moving back to main never is
      // in 60-card formats (no maximum).
      onMove:
        rules.sideboardMax > 0 || zone === "side"
          ? () => {
              hidePreview();
              onDeckChange(moveCardBetweenZones(deck, entry.card.id, zone));
            }
          : undefined,
    };
  };

  const sideFull = getSideboardCount(deck) >= rules.sideboardMax;
  const total = (g: Group) => g.entries.reduce((s, e) => s + e.quantity, 0);
  const isEmpty = deck.entries.length === 0 && sideboard.length === 0;

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

      {violations.length > 0 && (
        <div role="alert" className="alert alert-error alert-soft py-2 items-start">
          <TriangleAlert size={18} className="shrink-0 mt-0.5" />
          <div className="text-sm md:text-base space-y-0.5">
            <p className="font-semibold">
              This deck breaks {rules.label} rules.
            </p>
            {deckIssues.map((v) => (
              <p key={v.reason}>{v.reason}.</p>
            ))}
            {violationsByName.size > 0 && (
              <p>
                {violationsByName.size}{" "}
                {violationsByName.size === 1 ? "card is" : "cards are"} flagged
                below.
              </p>
            )}
          </div>
        </div>
      )}

      {isEmpty && (
        <p className="text-sm md:text-base text-base-content/60 italic">
          {rules.hasCommander
            ? "No cards yet. Search above to start adding to the 99."
            : "No cards yet. Search above to start building your deck."}
        </p>
      )}

      {view === "list" ? (
        <div className="columns-1 sm:columns-2 xl:columns-3 gap-6">
          {groups.map((g) => (
            <div key={g.key} className="break-inside-avoid mb-5">
              <GroupHeader
                label={g.label}
                count={total(g)}
                max={g.zone === "side" ? rules.sideboardMax : undefined}
              />
              <ul className="bg-base-100 rounded-lg border border-base-content/5 divide-y divide-base-content/5 overflow-hidden">
                {g.entries.map((entry) => {
                  const flags = violationsByName.get(entry.card.name);
                  return (
                    <li
                      key={entry.card.id}
                      {...previewProps(entry.card)}
                      tabIndex={0}
                      className={`group flex items-center gap-2 pl-3 pr-1 py-1.5 hover:bg-base-200/70 focus:bg-base-200/70 outline-none transition-colors ${flags ? "bg-error/10" : ""}`}
                    >
                      <span className="w-6 shrink-0 text-xs md:text-sm font-mono opacity-50">
                        {entry.quantity > 1 ? `${entry.quantity}×` : ""}
                      </span>
                      <span
                        className={`flex-1 min-w-0 truncate text-sm ${g.locked ? "font-bold text-primary" : "font-medium"}`}
                      >
                        {entry.card.name}
                      </span>
                      {flags && <ViolationFlag flags={flags} />}
                      <span className="shrink-0 opacity-80">
                        <ManaCost cost={entry.card.mana_cost} size={13} />
                      </span>
                      {g.locked ? (
                        <span className="w-7 shrink-0" />
                      ) : (
                        <EntryActions
                          name={entry.card.name}
                          actions={actionsFor(entry, g.zone)}
                          moveBlocked={g.zone === "main" && sideFull}
                          className="md:opacity-0 group-hover:opacity-100 group-focus:opacity-100 focus-within:opacity-100"
                        />
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-x-3 gap-y-6">
          {groups.map((g) => (
            <div key={g.key} className="min-w-0">
              <GroupHeader
                label={g.label}
                count={total(g)}
                max={g.zone === "side" ? rules.sideboardMax : undefined}
              />
              <div className="flex flex-col">
                {g.entries.map((entry, i) => (
                  <StackCard
                    key={entry.card.id}
                    entry={entry}
                    last={i === g.entries.length - 1}
                    locked={g.locked}
                    flags={violationsByName.get(entry.card.name)}
                    previewProps={previewProps(entry.card)}
                    actions={g.locked ? undefined : actionsFor(entry, g.zone)}
                    moveBlocked={g.zone === "main" && sideFull}
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

function GroupHeader({
  label,
  count,
  max,
}: {
  label: string;
  count: number;
  max?: number;
}) {
  return (
    <div className="flex items-center justify-between px-1 mb-1.5">
      <h3 className="text-xs md:text-sm font-black uppercase tracking-widest opacity-60">
        {label}
      </h3>
      <span
        className={`text-xs md:text-sm font-mono ${max !== undefined && count > max ? "text-error font-bold" : "opacity-50"}`}
      >
        {count}
        {max !== undefined && `/${max}`}
      </span>
    </div>
  );
}

function ViolationFlag({ flags }: { flags: Violation[] }) {
  const text = flags.map((f) => f.reason).join("; ");
  return (
    <span
      className="tooltip tooltip-left shrink-0 text-error"
      data-tip={text}
    >
      <TriangleAlert size={15} aria-label={text} />
    </span>
  );
}

const iconBtn =
  "btn btn-ghost btn-sm btn-circle shrink-0 text-base-content/50 transition-opacity";

/** − / + / move-to-sideboard buttons for one row. */
function EntryActions({
  name,
  actions,
  moveBlocked,
  className = "",
  compact = false,
}: {
  name: string;
  actions: RowActions;
  moveBlocked: boolean;
  className?: string;
  compact?: boolean;
}) {
  const stop =
    (fn: () => void) => (e: React.MouseEvent) => {
      e.stopPropagation();
      fn();
    };
  const bg = compact ? "bg-base-100/90 text-base-content btn-xs md:btn-sm" : "";
  const toSide = actions.zone === "main";
  return (
    <div className={`flex items-center shrink-0 ${className}`}>
      {actions.onMove && (
        <button
          type="button"
          onClick={stop(actions.onMove)}
          disabled={toSide && moveBlocked}
          aria-label={toSide ? `Move a ${name} to the sideboard` : `Move a ${name} to the main deck`}
          title={toSide ? (moveBlocked ? "Sideboard is full" : "Move to sideboard") : "Move to main deck"}
          className={`${iconBtn} ${bg} hover:text-primary hover:bg-primary/10`}
        >
          {toSide ? <ArrowDownToLine size={15} /> : <ArrowUpToLine size={15} />}
        </button>
      )}
      <button
        type="button"
        onClick={stop(actions.onRemove)}
        aria-label={`Remove a ${name}`}
        title="Remove one"
        className={`${iconBtn} ${bg} hover:text-error hover:bg-error/10`}
      >
        <Minus size={15} />
      </button>
      {actions.showAdd && (
      <span
        className={actions.addBlocked ? "tooltip tooltip-left" : ""}
        data-tip={actions.addBlocked ?? undefined}
      >
        <button
          type="button"
          onClick={stop(actions.onAdd)}
          disabled={!!actions.addBlocked}
          aria-label={
            actions.addBlocked
              ? `Can't add another ${name}: ${actions.addBlocked}`
              : `Add another ${name}`
          }
          className={`${iconBtn} ${bg} hover:text-primary hover:bg-primary/10`}
        >
          <Plus size={15} />
        </button>
      </span>
      )}
    </div>
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
  flags,
  previewProps,
  actions,
  moveBlocked,
}: {
  entry: DeckEntry;
  last: boolean;
  locked?: boolean;
  flags?: Violation[];
  previewProps: ReturnType<ReturnType<typeof useCardHoverPreview>["previewProps"]>;
  actions?: RowActions;
  moveBlocked: boolean;
}) {
  const src = getCardImageUris(entry.card)?.normal;
  return (
    <div
      {...previewProps}
      tabIndex={0}
      className={`group relative outline-none hover:z-10 focus-within:z-10 ${last ? "aspect-[488/680]" : "aspect-[488/88]"}`}
    >
      <div
        className={`absolute inset-x-0 top-0 aspect-[488/680] rounded-[4.75%/3.5%] overflow-hidden shadow-md ring-1 bg-base-300 transition-transform duration-150 group-hover:-translate-y-1 group-focus-within:-translate-y-1 group-focus-within:ring-2 group-focus-within:ring-primary ${flags ? "ring-2 ring-error" : "ring-black/30"}`}
      >
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
        {flags && (
          <span className="absolute bottom-2 left-1.5 right-1.5 badge badge-error h-auto py-0.5 text-xs md:text-sm font-bold shadow whitespace-normal">
            {flags.map((f) => f.reason).join("; ")}
          </span>
        )}
        {!locked && actions && (
          <div className="absolute top-[9%] left-1 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto transition-opacity">
            <EntryActions
              name={entry.card.name}
              actions={actions}
              moveBlocked={moveBlocked}
              compact
              className="gap-0.5"
            />
          </div>
        )}
      </div>
    </div>
  );
}
