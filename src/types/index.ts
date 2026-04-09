export interface ScryfallCard {
  id: string;
  name: string;
  mana_cost: string;
  cmc: number;
  type_line: string;
  oracle_text: string;
  color_identity: string[]; // ['W','U','B','R','G']
  colors: string[];
  power?: string;
  toughness?: string;
  legalities: Record<string, string>;
  image_uris?: { small: string; normal: string; large: string };
}

export type CardCategory =
  | "Commander"
  | "Creature"
  | "Land"
  | "Instant"
  | "Sorcery"
  | "Enchantment"
  | "Artifact"
  | "Planeswalker"
  | "Other";

export interface DeckEntry {
  card: ScryfallCard;
  quantity: number;
  category: CardCategory;
  objectiveIds: string[];
  type_line?: string;
}

export interface DeckVersion {
  id: string;
  name: string;
  note: string;
  swaps: {
    removeCardId: string;
    addCard: ScryfallCard;
  }[];
  objectiveOverrides: {
    cardId: string;
    objectiveIds: string[];
  }[];
  createdAt: string;
}

export interface Deck {
  id: string;
  name: string;
  commander: ScryfallCard | null;
  partner: ScryfallCard | null;
  colorIdentity: string[];
  entries: DeckEntry[];
  createdAt: string;
  updatedAt: string;
  objectives: Objective[];
  versions: DeckVersion[];
}

export interface Objective {
  id: string;
  label: string;
  description: string;
  color: string;
  createdAt: string;
}

export interface WishlistEntry {
  id: string;
  card: ScryfallCard;
  deckIds: string[];
  note: string;
  addedAt: string;
  objectives: Objective[];
}

export interface PendingSwap {
  removeCardName: string;
  removeCardId: string;
  addCard: ScryfallCard;
}
