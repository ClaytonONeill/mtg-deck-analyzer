import ManaSymbol from './ManaSymbol';

interface ManaCostProps {
  cost: string; // e.g. '{2}{U}{B}' or '{G}{G}{W}'
  size?: number;
  className?: string;
}

export default function ManaCost({
  cost,
  size = 14,
  className = '',
}: ManaCostProps) {
  if (!cost) return null;

  const symbols = [...cost.matchAll(/\{([^}]+)\}/g)].map((m) => m[1]);

  if (symbols.length === 0) return null;

  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`}>
      {symbols.map((sym, i) => (
        <ManaSymbol key={`${sym}-${i}`} symbol={sym} size={size} />
      ))}
    </span>
  );
}
