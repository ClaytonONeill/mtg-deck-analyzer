interface ManaSymbolProps {
  symbol: string;
  size?: number; // px, defaults to 16
  className?: string;
}

export default function ManaSymbol({
  symbol,
  size = 16,
  className = "",
}: ManaSymbolProps) {
  const clean = symbol.replace(/[{}/]/g, "").toUpperCase();
  return (
    <img
      src={`https://svgs.scryfall.io/card-symbols/${clean}.svg`}
      alt={`{${clean}}`}
      width={size}
      height={size}
      className={`inline-block ${className}`}
    />
  );
}
