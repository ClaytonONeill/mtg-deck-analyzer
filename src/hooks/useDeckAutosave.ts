// Modules
import { useState, useRef, useCallback } from "react";

// Store
import { deckStore } from "@/store/deckStore";

// Types
import type { Deck } from "@/types";

export type AutosaveStatus = "idle" | "saving" | "saved" | "error";

/**
 * Persists whole-deck snapshots one at a time, in order. Every save is a full
 * upsert, so two in flight at once could land out of order and leave the
 * older one in the database. Saves are queued instead, and a queued snapshot
 * that a newer one replaced is skipped, because the newer one carries its
 * change.
 *
 * On failure the local deck is left as it is. The next save writes everything
 * again, and so does `retry`. Rolling one card back would be wrong here: a
 * later save may already have written it.
 */
export function useDeckAutosave() {
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const latest = useRef<Deck | null>(null);

  const save = useCallback((deck: Deck): Promise<boolean> => {
    latest.current = deck;
    setStatus("saving");
    const run = queue.current.then(async () => {
      if (latest.current !== deck) return true;
      try {
        await deckStore.save(deck);
        if (latest.current === deck) setStatus("saved");
        return true;
      } catch (e) {
        console.error(`Autosave failed for ${deck.name}:`, e);
        if (latest.current === deck) setStatus("error");
        return false;
      }
    });
    queue.current = run;
    return run;
  }, []);

  const retry = useCallback(
    () => (latest.current ? save(latest.current) : Promise.resolve(true)),
    [save],
  );

  return { status, save, retry };
}
