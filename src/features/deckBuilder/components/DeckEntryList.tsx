import type { CardCategory, Deck } from '@/types';
import { removeCardFromDeck } from '@/store/deckStore';

import ManaCost from '@/components/ManaSymbol/ManaCost';

const CATEGORY_ORDER: CardCategory[] = [
  'Creature',
  'Instant',
  'Sorcery',
  'Enchantment',
  'Artifact',
  'Planeswalker',
  'Land',
  'Other',
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
    Record<CardCategory, (typeof deck.entries)[0][]>
  >(
    (acc, cat) => {
      acc[cat] = deck.entries.filter((e) => e.category === cat);
      return acc;
    },
    {} as Record<CardCategory, (typeof deck.entries)[0][]>,
  );

  const handleRemove = (cardId: string) => {
    onDeckChange(removeCardFromDeck(deck, cardId));
  };

  return (
    <div className="flex flex-col gap-6">
      {CATEGORY_ORDER.map((category) => {
        const entries = grouped[category];
        if (entries.length === 0) return null;
        return (
          <div key={category}>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
              {category} ({entries.reduce((s, e) => s + e.quantity, 0)})
            </h4>
            <ul className="flex flex-col gap-1">
              {entries.map((entry) => (
                <li
                  key={entry.card.id}
                  className="flex items-center justify-between bg-slate-800 rounded-lg px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 w-5 text-center font-mono">
                      {entry.quantity}x
                    </span>
                    <span className="text-white">{entry.card.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <ManaCost cost={entry.card.mana_cost} size={13} />
                    <button
                      onClick={() => handleRemove(entry.card.id)}
                      className="text-slate-500 hover:text-red-400 transition-colors text-xs"
                    >
                      ✕
                    </button>
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
