// Modules
import { useState, useEffect } from "react";

//Types
import type { ReactNode } from "react";
import type { Theme } from "@/types";

// Context
import { ThemeContext } from "@/hooks/useTheme";

const DEFAULT_THEME: Theme = "arcane";

/**
 * The old default was "dark", and ThemeProvider wrote it to localStorage on
 * first mount, so a stored "dark" usually means "never picked one" rather
 * than a deliberate choice. Move those users onto the new default once; the
 * "theme-migrated" flag means an explicit later pick of "dark" sticks.
 * Mirrored by the pre-paint script in index.html.
 */
function resolveInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem("theme") as Theme | null;
    if (!stored) return DEFAULT_THEME;
    if (stored === "dark" && !localStorage.getItem("theme-migrated"))
      return DEFAULT_THEME;
    return stored;
  } catch {
    return DEFAULT_THEME;
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(resolveInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("theme", theme);
      localStorage.setItem("theme-migrated", "1");
    } catch {
      // Storage unavailable (private mode etc.) — theme still applies.
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
