// Modules
import { useState } from "react";

// Types
import type { ReactNode } from "react";
import type { DeckEntry } from "@/types";

// Context
import { ChartSelectionContext } from "../hooks/useChartSelection";

export function ChartSelectionProvider({
  children,
  entries,
}: {
  children: ReactNode;
  entries: DeckEntry[];
}) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isStacked, setIsStacked] = useState(true); // Default to stacked

  return (
    <ChartSelectionContext.Provider
      value={{
        selectedCategory,
        setSelectedCategory,
        viewableEntries: entries,
        isStacked,
        setIsStacked,
      }}
    >
      {children}
    </ChartSelectionContext.Provider>
  );
}
