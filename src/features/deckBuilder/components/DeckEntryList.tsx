// Store
import { removeCardFromDeck } from "@/store/deckStore";

// Components
import ManaCost from "@/components/ManaSymbol/ManaCost";

// Types
import type { CardCategory, Deck } from "@/types";

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

interface DeckEntryListProps {
  deck: Deck;
  onDeckChange: (deck: Deck) => void;
}

export default function DeckEntryList({
  deck,
  onDeckChange,
}: DeckEntryListProps) {
  const grouped = CATEGORY_ORDER.reduce<
    Partial<Record<CardCategory, typeof deck.entries>>
  >((acc, cat) => {
    const matches = deck.entries.filter((e) => e.category === cat);
    if (matches.length > 0) acc[cat] = matches;
    return acc;
  }, {});

  const handleRemove = (cardId: string) => {
    onDeckChange(removeCardFromDeck(deck, cardId));
  };

  return (
    <div className="flex flex-col gap-6">
      {CATEGORY_ORDER.map((category) => {
        const entries = grouped[category];
        if (!entries || entries.length === 0) return null;

        const totalInCategory = entries.reduce((sum, e) => sum + e.quantity, 0);

        return (
          <div key={category} className="space-y-2">
            {/* Category Header */}
            <div className="flex items-center justify-between px-1">
              <h4 className="text-[10px] font-black uppercase tracking-widest opacity-50">
                {category}
              </h4>
              <div className="badge badge-ghost badge-sm font-mono opacity-40">
                {totalInCategory}
              </div>
            </div>

            {/* Normalized List */}
            <ul className="bg-base-100 rounded-lg border border-base-content/5 overflow-hidden divide-y divide-base-content/5">
              {entries.map((entry) => (
                <li key={entry.card.id} className="group transition-colors">
                  {/* Grid Layout for normalization */}
                  <div className="grid grid-cols-[3rem_1fr_auto_2rem] items-center py-2 px-3 gap-2">
                    {/* 1. Quantity (Fixed Width) */}
                    <span className="text-[10px] font-mono font-bold opacity-40">
                      {entry.quantity}x
                    </span>

                    {/* 2. Name (Flexible, takes remaining space) */}
                    <span className="truncate font-medium text-sm transition-colors pr-2">
                      {entry.card.name}
                    </span>

                    {/* 3. Mana Cost (Auto-width, right aligned) */}
                    <div className="flex justify-end min-w-[60px] opacity-80 scale-90 origin-right">
                      <ManaCost cost={entry.card.mana_cost} size={14} />
                    </div>

                    {/* 4. Action (Fixed Width) */}
                    <div className="flex justify-end">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleRemove(entry.card.id);
                        }}
                        className="btn btn-ghost btn-xs btn-circle text-base-content/20 hover:text-error hover:bg-error/10 md:opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3.5 w-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2.5"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
