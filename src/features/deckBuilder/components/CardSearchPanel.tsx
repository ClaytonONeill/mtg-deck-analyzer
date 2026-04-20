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
  disabled?: boolean;
}

export default function CardSearchPanel({
  commanderOnly = false,
  onSelectCard,
  label,
  placeholder = "Search cards...",
  disabled,
}: CardSearchPanelProps) {
  const [query, setQuery] = useState("");
  const [hoveredCard, setHoveredCard] = useState<ScryfallCard | null>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const { results, loading, error, search, searchNow, clear } = useCardSearch();

  const closeDropdown = useCallback(() => {
    clear();
    setHoveredCard(null);
    setAnchorRect(null);
    setActiveIndex(-1);
  }, [clear]);

  // Click Outside
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

  // Escape Key
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

  // Auto-scroll
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
    <div ref={containerRef} className="form-control w-full relative">
      <label className="label py-1">
        <span
          className={`label-text font-bold tracking-wide ${disabled ? "text-neutral-content/40" : "opacity-70"}`}
        >
          {disabled ? "MAX CARD LIMIT REACHED" : label.toUpperCase()}
        </span>
      </label>

      <div className="relative group">
        <input
          disabled={disabled}
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`input input-bordered w-full transition-all duration-200 ${
            disabled ? "input-disabled" : "focus:input-primary bg-base-200"
          }`}
        />
        {loading && (
          <span className="loading loading-spinner loading-xs absolute right-4 top-1/2 -translate-y-1/2 opacity-50" />
        )}
      </div>

      {error && (
        <label className="label pb-0">
          <span className="label-text-alt text-error font-medium">{error}</span>
        </label>
      )}

      {results.length > 0 && (
        <ul
          ref={listRef}
          className="absolute left-0 right-0 z-100 mt-1 flex flex-col flex-nowrap max-h-100 overflow-y-auto overflow-x-hidden menu bg-base-100 rounded-box border border-base-300 shadow-2xl p-2 w-[95%] md:w-3xl"
        >
          {results.map((card, index) => (
            <li key={card.id} className="w-full block">
              <button
                type="button"
                onClick={() => handleSelect(card)}
                onMouseEnter={(e) => {
                  setActiveIndex(index);
                  handleMouseEnter(card, e);
                }}
                onMouseLeave={handleMouseLeave}
                className={`flex flex-col items-start w-full p-3 rounded-md mb-1 ${
                  activeIndex === index ? "active" : ""
                }`}
              >
                {/* Row 1: Name and Pips */}
                <div className="flex justify-between items-center w-full min-w-0">
                  <span className="font-bold text-sm truncate">
                    {card.name}
                  </span>
                  <div className="flex gap-0.5 shrink-0 ml-2">
                    {(card.color_identity ?? []).map((c) => (
                      <ColorPip key={c} color={c} size={14} />
                    ))}
                  </div>
                </div>

                {/* Row 2: Type Line */}
                <div className="text-xs opacity-80 uppercase truncate w-full">
                  {card.type_line}
                </div>

                {/* Row 3: Stats */}
                <div className="flex items-center gap-2 mt-1 w-full min-w-0">
                  {card.mana_cost && (
                    <div className="shrink-0">
                      <ManaCost cost={card.mana_cost} size={14} />
                    </div>
                  )}
                  {card.power && (
                    <div className="badge badge-neutral badge-xs shrink-0">
                      {card.power}/{card.toughness}
                    </div>
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
