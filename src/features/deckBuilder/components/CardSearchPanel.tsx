import { useState } from "react";
import type { ScryfallCard } from "@/types";
import { useCardSearch } from "@/features/deckBuilder/hooks/useCardSearch";

interface CardSearchPanelProps {
  commanderOnly?: boolean;
  onSelectCard: (card: ScryfallCard) => void;
  label: string;
  placeholder?: string;
}

export default function CardSearchPanel({
  commanderOnly = false,
  onSelectCard,
  label,
  placeholder = "Search cards...",
}: CardSearchPanelProps) {
  const { results, loading, error, search, clear } = useCardSearch();
  const [query, setQuery] = useState("");

  const handleChange = (val: string) => {
    setQuery(val);
    search(val, commanderOnly);
  };

  const handleSelect = (card: ScryfallCard) => {
    onSelectCard(card);
    setQuery("");
    clear();
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-semibold text-slate-300">{label}</label>
      <input
        type="text"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#1971c2] transition-colors"
      />

      {loading && <p className="text-xs text-slate-500 px-1">Searching...</p>}
      {error && <p className="text-xs text-red-400 px-1">{error}</p>}

      {results.length > 0 && (
        <ul className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
          {results.map((card) => (
            <li key={card.id}>
              <button
                onClick={() => handleSelect(card)}
                className="w-full text-left px-4 py-2 text-sm hover:bg-slate-700 transition-colors flex items-center justify-between gap-4"
              >
                <span className="text-white font-medium">{card.name}</span>
                <span className="text-slate-400 text-xs shrink-0">
                  {card.type_line}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
