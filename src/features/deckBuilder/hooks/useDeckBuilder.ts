// Modules
import { useState, useEffect, useCallback, useRef } from 'react';

// Hooks
import { useDeckAutosave } from '@/hooks/useDeckAutosave';

// Store
import {
  createNewDeck,
  addCardToDeck,
  removeCardFromDeck,
  changeDeckFormat,
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
import { checkCardAdd, type AddCheckKind } from '@/features/formats/formats';

// Types
import type { Deck, DeckFormat, DeckZone, ScryfallCard } from '@/types';

/** Why the last add was refused. `kind` picks the alert tone. */
export interface AddWarning {
  kind: AddCheckKind;
  message: string;
}

export function useDeckBuilder(deckId?: string) {
  const [deck, setDeck] = useState<Deck>(createNewDeck(''));
  const [loading, setLoading] = useState(!!deckId);
  const [addWarning, setAddWarning] = useState<AddWarning | null>(null);
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
    setAddWarning(null);
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

  /** Switch format. Cards that break the new rules are kept and flagged. */
  const setFormat = useCallback(
    (format: DeckFormat) => {
      setAddWarning(null);
      setPartnerWarning(null);
      commitCards(changeDeckFormat(deckRef.current, format));
    },
    [commitCards],
  );

  const addCard = useCallback(
    (card: ScryfallCard, zone: DeckZone = 'main') => {
      const d = deckRef.current;
      const check = checkCardAdd(d, card, zone);
      if (!check.ok) {
        setAddWarning({ kind: check.kind, message: check.reason });
        return;
      }
      setAddWarning(null);
      commitCards(addCardToDeck(d, card, zone));
    },
    [commitCards],
  );

  const removeCard = useCallback(
    (cardId: string, zone: DeckZone = 'main') => {
      commitCards(removeCardFromDeck(deckRef.current, cardId, zone));
    },
    [commitCards],
  );

  const saveDeck = useCallback(async () => {
    if (!deck.name.trim()) return false;
    return save(deck);
  }, [deck, save]);

  const clearAddWarning = useCallback(() => setAddWarning(null), []);
  const clearPartnerWarning = useCallback(() => setPartnerWarning(null), []);

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
    addWarning,
    partnerWarning,
    commanderHasPartner,
    requiredPartnerName,
    setName,
    setFormat,
    setCommander,
    setPartner,
    removePartner,
    addCard,
    removeCard,
    saveDeck,
    clearAddWarning,
    clearPartnerWarning,
  };
}
