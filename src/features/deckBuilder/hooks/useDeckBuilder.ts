// Modules
import { useState, useEffect, useCallback } from 'react';

// Store
import {
  createNewDeck,
  addCardToDeck,
  removeCardFromDeck,
  isCardLegalForDeck,
  duplicateCardInDeck,
  deckStore,
  setCommander as storeSetCommander,
  setPartner as storeSetPartner,
  removePartner as storeRemovePartner,
} from '@/store/deckStore';

// Utils
import {
  getPartnerInfo,
  isValidPartner,
} from '@/features/deckBuilder/utils/partnerUtils';

// Types
import type { Deck, ScryfallCard } from '@/types';

export function useDeckBuilder(deckId?: string) {
  const [deck, setDeck] = useState<Deck>(createNewDeck(''));
  const [loading, setLoading] = useState(!!deckId);
  const [colorWarning, setColorWarning] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [partnerWarning, setPartnerWarning] = useState<string | null>(null);

  useEffect(() => {
    if (!deckId) return;

    let mounted = true;
    deckStore.getById(deckId).then((existing) => {
      if (!mounted) return;
      if (existing) setDeck(existing);
      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [deckId]);

  const setName = useCallback((name: string) => {
    setDeck((d) => ({ ...d, name }));
  }, []);

  const setCommander = useCallback((card: ScryfallCard) => {
    setDeck((d) => storeSetCommander(d, card));
    setColorWarning(null);
    setPartnerWarning(null);
    setDuplicateWarning(null);
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
      if (!isCardLegalForDeck(d.colorIdentity, card)) {
        setColorWarning(
          `${card.name} is outside your commander's color identity and cannot be added.`,
        );
        return d;
      }
      if (duplicateCardInDeck(d, card)) {
        setDuplicateWarning(`${card.name} is already in your deck.`);
        return d;
      }
      setColorWarning(null);
      setDuplicateWarning(null);
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

  const clearColorWarning = useCallback(() => setColorWarning(null), []);
  const clearPartnerWarning = useCallback(() => setPartnerWarning(null), []);
  const clearDuplicateWarning = useCallback(
    () => setDuplicateWarning(null),
    [],
  );

  const commanderPartnerInfo = deck.commander
    ? getPartnerInfo(deck.commander)
    : null;

  const commanderHasPartner =
    commanderPartnerInfo?.type !== 'none' && commanderPartnerInfo !== null;

  const requiredPartnerName =
    commanderPartnerInfo?.type === 'specific'
      ? commanderPartnerInfo.requiredPartnerName
      : null;

  return {
    deck,
    setDeck,
    loading,
    colorWarning,
    partnerWarning,
    commanderHasPartner,
    requiredPartnerName,
    duplicateWarning,
    setName,
    setCommander,
    setPartner,
    removePartner,
    addCard,
    removeCard,
    saveDeck,
    clearColorWarning,
    clearPartnerWarning,
    clearDuplicateWarning,
  };
}
