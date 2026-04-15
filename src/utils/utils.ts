// Types
import type { CardCategory, ScryfallCard } from '@/types';

export function inferCategory(cardInfo: string | ScryfallCard): CardCategory {
  // If cardInfo is a string, the type_line was provided directly,
  // other wise access the property within the card
  const t = (
    typeof cardInfo === 'string' ? cardInfo : cardInfo.type_line
  ).toLowerCase();

  if (t.includes('creature')) return 'Creature';
  if (t.includes('land')) return 'Land';
  if (t.includes('instant')) return 'Instant';
  if (t.includes('sorcery')) return 'Sorcery';
  if (t.includes('enchantment')) return 'Enchantment';
  if (t.includes('artifact')) return 'Artifact';
  if (t.includes('planeswalker')) return 'Planeswalker';
  return 'Other';
}

export const BASIC_LAND_NAMES = [
  'plains',
  'island',
  'swamp',
  'mountain',
  'forest',
];

export const configureBasicLandEndpoint = (land: string) => {
  return `https://api.scryfall.com/cards/named?exact=${land}&format=image&version=normal`;
};
