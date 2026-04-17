// Modules
import { useState, useEffect } from "react";

//Types
import type { ReactNode } from "react";

// Context
import { ThemeContext } from "@/hooks/useTheme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<string>(() => {
    return localStorage.getItem("theme") || "dark";
  });

  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
