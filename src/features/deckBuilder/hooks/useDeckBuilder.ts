// Modules
import { useState, useCallback } from "react";

// Store
import {
  createNewDeck,
  addCardToDeck,
  removeCardFromDeck,
  isCardLegalForDeck,
  deckStore,
} from "@/store/deckStore";

// Types
import type { Deck, ScryfallCard } from "@/types";

export function useDeckBuilder(existingDeck?: Deck) {
  // State
  const [deck, setDeck] = useState<Deck>(existingDeck ?? createNewDeck(""));
  const [colorWarning, setColorWarning] = useState<string | null>(null);

  const setName = useCallback((name: string) => {
    setDeck((d) => ({ ...d, name }));
  }, []);

  const setCommander = useCallback((card: ScryfallCard) => {
    setDeck((d) => addCardToDeck(d, card, true));
    setColorWarning(null);
  }, []);

  const addCard = useCallback((card: ScryfallCard) => {
    setDeck((d) => {
      if (!isCardLegalForDeck(d, card)) {
        setColorWarning(
          `${card.name} is outside your commander's color identity and cannot be added.`,
        );
        return d;
      }
      setColorWarning(null);
      return addCardToDeck(d, card);
    });
  }, []);

  const removeCard = useCallback((cardId: string) => {
    setDeck((d) => removeCardFromDeck(d, cardId));
  }, []);

  const saveDeck = useCallback(() => {
    if (!deck.name.trim()) return false;
    deckStore.save(deck);
    return true;
  }, [deck]);

  const clearWarning = useCallback(() => setColorWarning(null), []);

  return {
    deck,
    setDeck,
    colorWarning,
    setName,
    setCommander,
    addCard,
    removeCard,
    saveDeck,
    clearWarning,
  };
}
