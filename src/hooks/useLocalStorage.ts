// Modules
import { useState, useEffect } from "react";

const webStorage = (area: "local" | "session") =>
  area === "session" ? window.sessionStorage : window.localStorage;

/**
 * `useState` persisted to Web Storage as JSON. Pass `"session"` for state
 * that should survive navigation within a visit but not a new browser
 * session (e.g. active filters, which would otherwise silently hide cards
 * days later).
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  area: "local" | "session" = "local",
) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = webStorage(area).getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      webStorage(area).setItem(key, JSON.stringify(storedValue));
    } catch {
      console.error("Failed to write to web storage");
    }
  }, [key, storedValue, area]);

  return [storedValue, setStoredValue] as const;
}
