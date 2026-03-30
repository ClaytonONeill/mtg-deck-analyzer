// Modules
import { createContext, useContext } from "react";

// Types
import type { DeckEntry } from "@/types";

interface ChartSelectionContextType {
  selectedCategory: string | null;
  setSelectedCategory: (cat: string | null) => void;
  viewableEntries: DeckEntry[];
  isStacked: boolean; // Add this
  setIsStacked: (val: boolean) => void; // Add this
}

export const ChartSelectionContext = createContext<
  ChartSelectionContextType | undefined
>(undefined);

export function useChartSelection() {
  const context = useContext(ChartSelectionContext);
  if (!context)
    throw new Error("useChartSelection must be used within Provider");
  return context;
}
