// Modules
import { useState, useCallback, useRef } from "react";

// Types
import type { ScryfallCard } from "@/types";

const BASE = "https://api.scryfall.com";
const MIN_QUERY = 3;

async function fetchCards(
  query: string,
  commanderOnly: boolean,
  signal: AbortSignal,
): Promise<ScryfallCard[]> {
  const q = commanderOnly
    ? `${query} is:commander format:commander`
    : `${query} format:commander`;

  const res = await fetch(
    `${BASE}/cards/search?q=${encodeURIComponent(q)}&order=name`,
    { signal },
  );
  const data = await res.json();
  return data.object === "error" ? [] : (data.data as ScryfallCard[]);
}

export function useCardSearch() {
  console.log("testing for calls");
  const [results, setResults] = useState<ScryfallCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  const runSearch = useCallback(
    async (query: string, commanderOnly: boolean) => {
      // Cancel any in-flight request
      if (abortRef.current) abortRef.current.abort();

      // Stamp this request with a unique ID
      const requestId = ++requestIdRef.current;
      abortRef.current = new AbortController();
      const { signal } = abortRef.current;

      setLoading(true);
      setError(null);

      try {
        const cards = await fetchCards(query, commanderOnly, signal);

        // Only apply results if this is still the latest request
        if (requestId === requestIdRef.current) {
          setResults(cards);
        }
      } catch (err) {
        // Ignore abort errors — they are intentional
        if (err instanceof Error && err.name === "AbortError") return;
        if (requestId === requestIdRef.current) {
          setError("Search failed. Check your connection.");
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [],
  );

  const search = useCallback(
    (query: string, commanderOnly = false) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (!query.trim() || query.trim().length < MIN_QUERY) {
        // Cancel any in-flight request and clear results for short queries
        if (abortRef.current) abortRef.current.abort();
        setResults([]);
        setLoading(false);
        return;
      }

      debounceRef.current = setTimeout(() => {
        void runSearch(query, commanderOnly);
      }, 350);
    },
    [runSearch],
  );

  // Enter key — fires immediately, bypasses debounce but still respects MIN_QUERY
  const searchNow = useCallback(
    (query: string, commanderOnly = false) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (!query.trim() || query.trim().length < MIN_QUERY) {
        setResults([]);
        return;
      }

      void runSearch(query, commanderOnly);
    },
    [runSearch],
  );

  const clear = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setResults([]);
    setLoading(false);
  }, []);

  return { results, loading, error, search, searchNow, clear };
}
