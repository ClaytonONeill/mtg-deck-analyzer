// Types
import type { ScryfallCard } from '@/types';

// Utils
import { getCardImageUris } from '@/utils/cardImage';
import { manaGradient } from '@/utils/manaColors';

interface CommanderBackdropProps {
  commander: ScryfallCard | null | undefined;
  partner?: ScryfallCard | null;
  colorIdentity: string[];
}

/**
 * Decorative commander art behind a deck's title block. Sits absolutely in
 * the top of its (relative) parent, faded out to the page background on all
 * sides via a mask so text over it stays readable, with a thin color-identity
 * rule along the top. Purely visual: aria-hidden, pointer-events-none.
 */
export default function CommanderBackdrop({
  commander,
  partner,
  colorIdentity,
}: CommanderBackdropProps) {
  const arts = [commander, partner]
    .map((c) => {
      const uris = getCardImageUris(c);
      return uris?.art_crop ?? uris?.normal;
    })
    .filter((src): src is string => !!src);

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 h-72 overflow-hidden"
    >
      <div
        className="absolute inset-x-6 top-0 h-px opacity-70"
        style={{ background: manaGradient(colorIdentity) }}
      />
      {arts.length > 0 && (
        <div
          className="absolute inset-0 flex justify-end opacity-35"
          style={{
            maskImage:
              'radial-gradient(ellipse 60% 85% at 80% 20%, black 25%, transparent 75%)',
            WebkitMaskImage:
              'radial-gradient(ellipse 60% 85% at 80% 20%, black 25%, transparent 75%)',
          }}
        >
          {arts.map((src) => (
            <img
              key={src}
              src={src}
              alt=""
              className="h-full w-1/2 md:w-1/3 object-cover"
            />
          ))}
        </div>
      )}
    </div>
  );
}
