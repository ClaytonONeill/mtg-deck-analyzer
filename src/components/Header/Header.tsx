// Modules
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// Context
import { useAuth } from "@/hooks/useAuthContext";
import { useTheme } from "@/hooks/useTheme";

// Components
import ThemeDropdown from "@/components/ThemeDropDown/ThemeDropdown";

// Icons
import { Menu, X } from "lucide-react";

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
    <header className="relative border-b bg-base-100 border-base-300 px-6 py-4 flex items-center justify-between z-50">
      <h1
        className="text-xl md:text-2xl font-black tracking-tighter text-primary italic hover:cursor-pointer"
        onClick={() => navTo("/")}
      >
        MTG <span className="text-base-content">DECK ANALYZER</span>
      </h1>
      <div className="flex items-center gap-3">
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
              ✨ Wishlist
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

        {/* Hamburger Toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="btn btn-sm btn-ghost btn-square md:hidden text-base-content/70"
          aria-label="Toggle Menu"
        >
          {isOpen ? <X /> : <Menu />}
        </button>
        <ThemeDropdown theme={theme} onThemeChange={setTheme} />
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
              ✨ Wishlist
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
