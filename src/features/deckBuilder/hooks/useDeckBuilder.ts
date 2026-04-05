// Modules
import { useState, useCallback } from "react";

// Store
import {
  createNewDeck,
  addCardToDeck,
  removeCardFromDeck,
  isCardLegalForDeck,
  deckStore,
  setCommander as storeSetCommander,
  setPartner as storeSetPartner,
  removePartner as storeRemovePartner,
} from "@/store/deckStore";

// Utils
import {
  getPartnerInfo,
  isValidPartner,
} from "@/features/deckBuilder/utils/partnerUtils";

// Types
import type { Deck, ScryfallCard } from "@/types";

export function useDeckBuilder(existingDeck?: Deck) {
  const [deck, setDeck] = useState<Deck>(existingDeck ?? createNewDeck(""));
  const [colorWarning, setColorWarning] = useState<string | null>(null);
  const [partnerWarning, setPartnerWarning] = useState<string | null>(null);

  const setName = useCallback((name: string) => {
    setDeck((d) => ({ ...d, name }));
  }, []);

  const setCommander = useCallback((card: ScryfallCard) => {
    setDeck((d) => storeSetCommander(d, card));
    setColorWarning(null);
    setPartnerWarning(null);
  }, []);

  const setPartner = useCallback((card: ScryfallCard) => {
    setDeck((d) => {
      if (!d.commander) return d;

      const { valid, reason } = isValidPartner(d.commander, card);
      if (!valid) {
        setPartnerWarning(reason);
        return d;
      }

      setPartnerWarning(null);
      return storeSetPartner(d, card);
    });
  }, []);

  const removePartner = useCallback(() => {
    setDeck((d) => storeRemovePartner(d));
    setPartnerWarning(null);
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

  const saveDeck = useCallback(async () => {
    if (!deck.name.trim()) return false;
    await deckStore.save(deck);
    return true;
  }, [deck]);

  const clearWarning = useCallback(() => setColorWarning(null), []);
  const clearPartnerWarning = useCallback(() => setPartnerWarning(null), []);

  // Derived partner eligibility off current commander
  const commanderPartnerInfo = deck.commander
    ? getPartnerInfo(deck.commander)
    : null;

  const commanderHasPartner =
    commanderPartnerInfo?.type !== "none" && commanderPartnerInfo !== null;

  const requiredPartnerName =
    commanderPartnerInfo?.type === "specific"
      ? commanderPartnerInfo.requiredPartnerName
      : null;

  return {
    deck,
    setDeck,
    colorWarning,
    partnerWarning,
    commanderHasPartner,
    requiredPartnerName,
    setName,
    setCommander,
    setPartner,
    removePartner,
    addCard,
    removeCard,
    saveDeck,
    clearWarning,
    clearPartnerWarning,
  };
}
