import { useState, useCallback, useRef } from "react";
import type { ScryfallCard } from "@/types";

const BASE = "https://api.scryfall.com";

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
        const q = commanderOnly
          ? `${query} is:commander format:commander`
          : `${query} format:commander`;
        const res = await fetch(
          `${BASE}/cards/search?q=${encodeURIComponent(q)}&order=name`,
        );
        const data = await res.json();
        if (data.object === "error") {
          setResults([]);
        } else {
          setResults(data.data as ScryfallCard[]);
        }
      } catch {
        setError("Search failed. Check your connection.");
      } finally {
        setLoading(false);
      }
    }, 350);
  }, []);

  const clear = useCallback(() => setResults([]), []);

  return { results, loading, error, search, clear };
}
