/* eslint-disable react-hooks/refs */
// Modules
import { useEffect, useRef } from "react";

export function usePortal() {
  const elRef = useRef<HTMLDivElement | null>(null);

  if (!elRef.current) {
    elRef.current = document.createElement("div");
  }

  useEffect(() => {
    const el = elRef.current!;
    document.body.appendChild(el);
    return () => {
      document.body.removeChild(el);
    };
  }, []);

  return elRef.current;
}
