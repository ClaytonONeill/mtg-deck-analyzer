// Types
import type { Theme } from "@/types";

// Icons
import { ChevronDown } from "lucide-react";

interface ThemeDropdownProps {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
}

const ThemePips = ({ theme }: { theme: string }) => (
  <div
    data-theme={theme}
    className="grid grid-cols-2 gap-1 bg-base p-1 border border-base-content/20 rounded-md"
  >
    {["bg-primary", "bg-secondary", "bg-accent", "bg-neutral"].map((color) => (
      <div key={color} className={`${color} w-2 h-2 rounded-full`} />
    ))}
  </div>
);

export default function ThemeDropdown({
  theme,
  onThemeChange,
}: ThemeDropdownProps) {
  const THEMES = [
    "dark",
    "light",
    "emerald",
    "fantasy",
    "retro",
    "nord",
    "cupcake",
    "bumblebee",
    "pastel",
    "valentine",
    "halloween",
    "garden",
    "forest",
    "dracula",
    "business",
    "night",
  ];

  return (
    <div className="dropdown dropdown-end ml-1">
      <div tabIndex={0} role="button" className="btn btn-md btn-ghost gap-2">
        <ThemePips theme={theme} />
        <ChevronDown className="hidden md:flex" />
      </div>
      <ul
        tabIndex={-1}
        className="dropdown-content bg-base-300 rounded-box z-50 w-52 p-2 shadow-2xl max-h-80 overflow-y-auto"
      >
        {THEMES.map((t) => (
          <li key={t}>
            <button
              onClick={() => onThemeChange(t as Theme)}
              className={`
                w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm
                hover:bg-base-200 transition-colors text-left capitalize
                ${theme === t ? "bg-base-200 font-semibold" : ""}
              `}
            >
              <ThemePips theme={t} />
              {t}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
