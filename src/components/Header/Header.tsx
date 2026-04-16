// Modules
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// Context
import { useAuth } from "@/hooks/useAuthContext";
import { useTheme } from "@/hooks/useTheme";

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
        className="text-xl font-bold tracking-tight text-base-content hover:cursor-pointer"
        onClick={() => navTo("/")}
      >
        MTG Deck Analyzer
      </h1>

      <div className="flex items-center gap-3">
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-3">
          {!isObjectivesPage && (
            <button
              onClick={() => navTo("/objectives")}
              className="text-sm font-semibold text-base-content opacity-70 hover:text-primary border border-base-300 hover:border-primary px-4 py-2 rounded-lg transition-colors cursor-pointer"
            >
              Objectives
            </button>
          )}
          {!isWishlistPage && (
            <button
              onClick={() => navTo("/wishlist")}
              className="text-sm font-semibold text-base-content opacity-70 hover:text-base-content border border-base-300 hover:border-base-content px-4 py-2 rounded-lg transition-colors cursor-pointer"
            >
              ✨ Wishlist
            </button>
          )}

          {!isBuildPage && (
            <button
              onClick={() => navTo("/build")}
              className="btn btn-primary btn-sm"
            >
              + New Deck
            </button>
          )}
          <button
            onClick={handleSignOut}
            className="text-sm font-semibold text-base-content opacity-50 hover:text-error border border-base-300 hover:border-error px-4 py-2 rounded-lg transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </nav>

        {/* Theme Selector */}
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          className="select select-bordered select-sm"
        >
          <option value="dark">Dark</option>
          <option value="light">Light</option>
          <option value="cupcake">Cupcake</option>
          <option value="bumblebee">Bumblebee</option>
          <option value="valentine">Valentine</option>
          <option value="halloween">Halloween</option>
          <option value="garden">Garden</option>
          <option value="forest">Forest</option>
          <option value="dracula">Dracula</option>
          <option value="business">Business</option>
        </select>

        {/* Hamburger Toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden text-base-content opacity-70 hover:text-base-content p-2"
          aria-label="Toggle Menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {isOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16m-7 6h7"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 bg-base-100 border-b border-base-300 p-4 flex flex-col gap-3 md:hidden animate-in fade-in slide-in-from-top-2">
          {!isObjectivesPage && (
            <button
              onClick={() => navTo("/objectives")}
              className="w-full text-left text-sm font-semibold text-base-content px-4 py-3 rounded-lg border border-base-300 hover:bg-base-200"
            >
              Objectives
            </button>
          )}
          {!isWishlistPage && (
            <button
              onClick={() => navTo("/wishlist")}
              className="w-full text-left text-sm font-semibold text-base-content px-4 py-3 rounded-lg border border-base-300 hover:bg-base-200"
            >
              ✨ Wishlist
            </button>
          )}
          {!isBuildPage && (
            <button
              onClick={() => navTo("/build")}
              className="btn btn-primary btn-sm w-full"
            >
              + New Deck
            </button>
          )}
          <button
            onClick={handleSignOut}
            className="text-sm font-semibold text-error border border-base-300 hover:bg-base-200 px-4 py-2 rounded-lg transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      )}
    </header>
  );
}
