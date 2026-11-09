// Modules
import { useState, useEffect, useCallback, useRef } from 'react';

// Hooks
import { useDeckAutosave } from '@/hooks/useDeckAutosave';

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
  const { status: saveStatus, save, retry: retrySave } = useDeckAutosave();

  // Latest committed deck, so card mutations can validate against it and
  // hand the exact same snapshot to both React state and the autosave.
  const deckRef = useRef(deck);
  useEffect(() => {
    deckRef.current = deck;
  }, [deck]);

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

  /** Applies a card add/remove and autosaves it, so backing out of the
   * builder never loses cards. An unnamed new deck has nothing to save
   * under yet; its cards are written once it has a name. */
  const commitCards = useCallback(
    (next: Deck) => {
      deckRef.current = next;
      setDeck(next);
      if (next.name.trim()) void save(next);
    },
    [save],
  );

  const addCard = useCallback(
    (card: ScryfallCard) => {
      const d = deckRef.current;
      if (!isCardLegalForDeck(d.colorIdentity, card)) {
        setColorWarning(
          `${card.name} is outside your commander's color identity and cannot be added.`,
        );
        return;
      }
      if (duplicateCardInDeck(d, card)) {
        setDuplicateWarning(`${card.name} is already in your deck.`);
        return;
      }
      setColorWarning(null);
      setDuplicateWarning(null);
      commitCards(addCardToDeck(d, card));
    },
    [commitCards],
  );

  const removeCard = useCallback(
    (cardId: string) => {
      commitCards(removeCardFromDeck(deckRef.current, cardId));
    },
    [commitCards],
  );

  const saveDeck = useCallback(async () => {
    if (!deck.name.trim()) return false;
    return save(deck);
  }, [deck, save]);

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
    commitCards,
    loading,
    saveStatus,
    retrySave,
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
