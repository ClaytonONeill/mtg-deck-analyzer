// Modules
import { useState } from "react";

// Hooks
import { useCardSearch } from "@/features/deckBuilder/hooks/useCardSearch";

// Components
import CardImageTooltip from "@/components/CardImageTooltip/CardImageTooltip";
import ManaCost from "@/components/ManaSymbol/ManaCost";
import ColorPip from "@/components/ManaSymbol/ColorPip";

// Types
import type { ScryfallCard } from "@/types";

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
  // State
  const [query, setQuery] = useState("");
  const [hoveredCard, setHoveredCard] = useState<ScryfallCard | null>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

  // Hook
  const { results, loading, error, search, searchNow, clear } = useCardSearch();

  const handleChange = (val: string) => {
    setQuery(val);
    search(val, commanderOnly);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") searchNow(query, commanderOnly);
  };

  const handleSelect = (card: ScryfallCard) => {
    onSelectCard(card);
    setQuery("");
    clear();
    setHoveredCard(null);
    setAnchorRect(null);
  };

  const handleMouseEnter = (
    card: ScryfallCard,
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    setHoveredCard(card);
    setAnchorRect(e.currentTarget.getBoundingClientRect());
  };

  const handleMouseLeave = () => {
    setHoveredCard(null);
    setAnchorRect(null);
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <label className="text-sm font-semibold text-slate-300">{label}</label>

      <input
        type="text"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#1971c2] transition-colors"
      />

      {loading && <p className="text-xs text-slate-500 px-1">Searching...</p>}
      {error && <p className="text-xs text-red-400 px-1">{error}</p>}

      {results.length > 0 && (
        <ul className="bg-slate-900 border border-slate-700 rounded-xl overflow-y-auto max-h-[420px] divide-y divide-slate-800 shadow-2xl">
          {results.map((card) => (
            <li key={card.id}>
              <button
                onClick={() => handleSelect(card)}
                onMouseEnter={(e) => handleMouseEnter(card, e)}
                onMouseLeave={handleMouseLeave}
                className="w-full text-left px-4 py-3 hover:bg-slate-800 transition-colors"
              >
                {/* Row 1 — name + color pips */}
                <div className="flex items-center justify-between gap-3 mb-1">
                  <span className="text-white font-semibold text-sm">
                    {card.name}
                  </span>
                  <div className="flex gap-1 shrink-0">
                    {card.color_identity.map((c) => (
                      <ColorPip key={c} color={c} size={16} />
                    ))}
                  </div>
                </div>

                {/* Row 2 — type line */}
                <p className="text-slate-400 text-xs mb-2">{card.type_line}</p>

                {/* Row 3 — stat chips */}
                <div className="flex gap-2 flex-wrap">
                  {card.cmc > 0 && <ManaCost cost={card.mana_cost} size={14} />}
                  {card.power && card.toughness && (
                    <span className="bg-slate-700 text-slate-300 text-[11px] font-mono px-2 py-0.5 rounded">
                      {card.power} / {card.toughness}
                    </span>
                  )}
                  {card.oracle_text && (
                    <span className="text-slate-500 text-[11px] italic truncate max-w-[280px]">
                      {card.oracle_text.split("\n")[0]}
                    </span>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      <CardImageTooltip card={hoveredCard} anchorRect={anchorRect} />
    </div>
  );
}
