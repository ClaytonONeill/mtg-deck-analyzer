// Modules
import { useState, useRef, useEffect, useCallback } from "react";

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
  const [activeIndex, setActiveIndex] = useState(-1);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Hook
  const { results, loading, error, search, searchNow, clear } = useCardSearch();

  const closeDropdown = useCallback(() => {
    clear();
    setHoveredCard(null);
    setAnchorRect(null);
    setActiveIndex(-1);
  }, [clear]);

  // Click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        closeDropdown();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [closeDropdown]);

  // Escape key — global listener so it works even if input loses focus
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        closeDropdown();
        inputRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [closeDropdown]);

  // Scroll active item into view when arrow navigating
  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const item = listRef.current.children[activeIndex] as HTMLElement;
    item?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const handleChange = (val: string) => {
    setQuery(val);
    setActiveIndex(-1);
    search(val, commanderOnly);
  };

  const handleSelect = useCallback(
    (card: ScryfallCard) => {
      onSelectCard(card);
      setQuery("");
      setActiveIndex(-1);
      clear();
      setHoveredCard(null);
      setAnchorRect(null);
      // Retain focus in input so user can type immediately
      inputRef.current?.focus();
    },
    [onSelectCard, clear],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case "Enter":
        if (activeIndex >= 0 && results[activeIndex]) {
          e.preventDefault();
          handleSelect(results[activeIndex]);
        } else {
          searchNow(query, commanderOnly);
        }
        break;

      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, results.length - 1));
        break;

      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        break;

      case "Escape":
        closeDropdown();
        break;
    }
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
    <div ref={containerRef} className="flex flex-col gap-2 w-full">
      <label className="text-sm font-semibold text-slate-300">{label}</label>

      <input
        ref={inputRef}
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
        <ul
          ref={listRef}
          className="bg-slate-900 border border-slate-700 rounded-xl overflow-y-auto max-h-105 divide-y divide-slate-800 shadow-2xl"
        >
          {results.map((card, index) => (
            <li key={card.id}>
              <button
                onClick={() => handleSelect(card)}
                onMouseEnter={(e) => {
                  setActiveIndex(index);
                  handleMouseEnter(card, e);
                }}
                onMouseLeave={handleMouseLeave}
                className="w-full text-left px-4 py-3 transition-colors"
                style={{
                  backgroundColor:
                    activeIndex === index ? "#1e293b" : "transparent",
                }}
              >
                {/* Row 1 — name + color pips */}
                <div className="flex items-center justify-between gap-3 mb-1">
                  <span className="text-white font-semibold text-sm">
                    {card.name}
                  </span>
                  <div className="flex gap-1 shrink-0">
                    {(card.color_identity ?? []).map((c) => (
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
                    <span className="text-slate-500 text-[11px] italic truncate max-w-70">
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
