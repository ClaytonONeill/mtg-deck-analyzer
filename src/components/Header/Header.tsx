// Modules
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// Context
import { useAuth } from "@/hooks/useAuthContext";
import { useTheme } from "@/hooks/useTheme";

// Components
import ThemeDropdown from "@/components/ThemeDropDown/ThemeDropdown";

// Icons
import { Menu, Sparkles, X } from "lucide-react";

// A five-pointed "spark": one point per color of mana, tinted by the theme's
// primary. Turns slowly on hover.
function BrandMark() {
  return (
    <svg
      viewBox="0 0 32 32"
      className="w-7 h-7 md:w-8 md:h-8 shrink-0 text-primary drop-shadow-[0_0_6px_color-mix(in_oklab,var(--color-primary)_55%,transparent)] transition-transform duration-700 group-hover:rotate-[72deg]"
      aria-hidden
    >
      <circle cx="16" cy="16" r="14.5" fill="none" stroke="currentColor" strokeOpacity="0.35" />
      <path
        fill="currentColor"
        d="M16 2.5 18.6 12 28.8 11.8 20.6 17.9 23.9 27.6 16 21.6 8.1 27.6 11.4 17.9 3.2 11.8 13.4 12Z"
      />
      <circle cx="16" cy="16" r="2.4" className="fill-base-100" />
    </svg>
  );
}

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  const isBuildPage = location.pathname === "/build";
  const isWishlistPage = location.pathname === "/wishlist";
  const isObjectivesPage = location.pathname === "/objectives";

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const navTo = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <header className="relative bg-base-100 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between gap-3 z-50">
      {/* Gilded rule instead of a flat border */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-primary/60 to-transparent"
      />
      <button
        type="button"
        onClick={() => navTo("/")}
        className="group flex items-center gap-2 md:gap-2.5 text-left min-w-0"
        aria-label="Home"
      >
        <BrandMark />
        {/* min-w-0 + leading-tight: on narrow phones the wordmark wraps to two
            lines instead of squeezing the controls on the right. */}
        <h1 className="min-w-0 font-display text-base sm:text-lg md:text-2xl font-black tracking-wide leading-tight md:leading-none">
          <span className="text-primary">MTG</span>{" "}
          <span className="text-base-content">Deck Analyzer</span>
        </h1>
      </button>
      <div className="flex items-center gap-1 md:gap-3 shrink-0">
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-3">
          {!isObjectivesPage && (
            <button
              onClick={() => navTo("/objectives")}
              className="btn btn-sm btn-outline border-base-300 text-base-content/70 hover:bg-transparent hover:text-primary hover:border-primary font-semibold"
            >
              Objectives
            </button>
          )}
          {!isWishlistPage && (
            <button
              onClick={() => navTo("/wishlist")}
              className="btn btn-sm btn-outline border-base-300 text-base-content/70 hover:bg-transparent hover:text-base-content hover:border-base-content font-semibold"
            >
              <Sparkles size={15} /> Wishlist
            </button>
          )}

          {!isBuildPage && (
            <button
              onClick={() => navTo("/build")}
              className="btn btn-sm btn-primary font-semibold"
            >
              + New Deck
            </button>
          )}
          <button
            onClick={handleSignOut}
            className="btn btn-sm btn-outline border-base-300 text-base-content/50 hover:bg-error hover:text-error-content hover:border-error font-semibold"
          >
            Sign Out
          </button>
        </nav>
        <ThemeDropdown theme={theme} onThemeChange={setTheme} />
        {/* Hamburger Toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="btn btn-sm btn-ghost btn-square md:hidden text-base-content/70"
          aria-label="Toggle Menu"
        >
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 bg-base-100 border-b border-base-300 p-4 flex flex-col gap-3 md:hidden animate-in fade-in slide-in-from-top-2 shadow-lg">
          {!isObjectivesPage && (
            <button
              onClick={() => navTo("/objectives")}
              className="btn btn-outline border-base-300 justify-start text-base-content/70 w-full"
            >
              Objectives
            </button>
          )}
          {!isWishlistPage && (
            <button
              onClick={() => navTo("/wishlist")}
              className="btn btn-outline border-base-300 justify-start text-base-content/70 w-full"
            >
              <Sparkles size={15} /> Wishlist
            </button>
          )}
          {!isBuildPage && (
            <button
              onClick={() => navTo("/build")}
              className="btn btn-primary justify-start w-full"
            >
              + New Deck
            </button>
          )}
          <button
            onClick={handleSignOut}
            className="btn btn-outline btn-error justify-start w-full"
          >
            Sign Out
          </button>
        </div>
      )}
    </header>
  );
}
