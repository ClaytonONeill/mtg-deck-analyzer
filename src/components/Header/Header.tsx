// Modules
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// Context
import { useAuth } from "@/hooks/useAuthContext";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();

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
    <header className="relative border-b bg-slate-950 border-slate-800 px-6 py-4 flex items-center justify-between z-50">
      <h1
        className="text-xl font-bold tracking-tight text-white hover:cursor-pointer"
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
              className="text-sm font-semibold text-slate-400 hover:text-indigo-300 border border-slate-700 hover:border-indigo-500 px-4 py-2 rounded-lg transition-colors cursor-pointer"
            >
              Objectives
            </button>
          )}
          {!isWishlistPage && (
            <button
              onClick={() => navTo("/wishlist")}
              className="text-sm font-semibold text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-4 py-2 rounded-lg transition-colors cursor-pointer"
            >
              ✨ Wishlist
            </button>
          )}

          {!isBuildPage && (
            <button
              onClick={() => navTo("/build")}
              className="bg-[#1971c2] hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
            >
              + New Deck
            </button>
          )}
          <button
            onClick={handleSignOut}
            className="text-sm font-semibold text-slate-500 hover:text-red-400 border border-slate-700 hover:border-red-400 px-4 py-2 rounded-lg transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </nav>

        {/* Hamburger Toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden text-slate-400 hover:text-white p-2"
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
        <div className="absolute top-full left-0 right-0 bg-slate-950 border-b border-slate-800 p-4 flex flex-col gap-3 md:hidden animate-in fade-in slide-in-from-top-2">
          {!isObjectivesPage && (
            <button
              onClick={() => navTo("/objectives")}
              className="w-full text-left text-sm font-semibold text-slate-400 hover:text-white px-4 py-3 rounded-lg border border-slate-800"
            >
              Objectives
            </button>
          )}
          {!isWishlistPage && (
            <button
              onClick={() => navTo("/wishlist")}
              className="w-full text-left text-sm font-semibold text-slate-400 hover:text-white px-4 py-3 rounded-lg border border-slate-800"
            >
              ✨ Wishlist
            </button>
          )}
          {!isBuildPage && (
            <button
              onClick={() => navTo("/build")}
              className="w-full text-left text-sm font-semibold bg-[#1971c2] text-white px-4 py-3 rounded-lg"
            >
              + New Deck
            </button>
          )}
          <button
            onClick={handleSignOut}
            className="text-sm font-semibold text-slate-500 hover:text-red-400 border border-slate-700 hover:border-red-400 px-4 py-2 rounded-lg transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      )}
    </header>
  );
}
