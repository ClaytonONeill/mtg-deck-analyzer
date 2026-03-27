// Modules
import { useState, useCallback, useRef } from "react";

// Types
import type { ScryfallCard } from "@/types";

const BASE = "https://api.scryfall.com";

async function fetchCards(
  query: string,
  commanderOnly: boolean,
): Promise<ScryfallCard[]> {
  const q = commanderOnly
    ? `${query} is:commander format:commander`
    : `${query} format:commander`;
  const res = await fetch(
    `${BASE}/cards/search?q=${encodeURIComponent(q)}&order=name`,
  );
  const data = await res.json();
  return data.object === "error" ? [] : (data.data as ScryfallCard[]);
}

export function useCardSearch() {
  const [results, setResults] = useState<ScryfallCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback((query: string, commanderOnly = false) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        setResults(await fetchCards(query, commanderOnly));
      } catch {
        setError("Search failed. Check your connection.");
      } finally {
        setLoading(false);
      }
    }, 350);
  }, []);

  // Enter key handler
  const searchNow = useCallback(
    async (query: string, commanderOnly = false) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (!query.trim()) {
        setResults([]);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        setResults(await fetchCards(query, commanderOnly));
      } catch {
        setError("Search failed. Check your connection.");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const clear = useCallback(() => setResults([]), []);

  return { results, loading, error, search, searchNow, clear };
}
