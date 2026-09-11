// Utils
import { resolvePrices, type PriceableCard } from '@/utils/priceUtils';

// Hooks
import { useCardPrices } from '@/hooks/useCardPriceContext';

interface CardPriceProps {
  card: PriceableCard;
  className?: string;
}

export default function CardPrice({ card, className = '' }: CardPriceProps) {
  const livePrices = useCardPrices();
  const prices = resolvePrices(card, livePrices);

  const usd = prices?.usd;
  const usdFoil = prices?.usd_foil;
  const price = usd ?? usdFoil;
  const isFoilOnly = !usd && !!usdFoil;

  if (!price) {
    return (
      <p className={`text-sm opacity-60 italic ${className}`}>
        No price info
      </p>
    );
  }

  return (
    <p className={`text-sm ${className}`}>
      <span className="font-mono font-bold text-primary">${price}</span>
      {isFoilOnly && <span className="text-primary"> (foil)</span>}{' '}
      <span className="opacity-60">· TCGplayer</span>
    </p>
  );
}
