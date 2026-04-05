import { useNavigate, useLocation } from 'react-router-dom';

// Context
import { useAuth } from '@/hooks/useAuthContext';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();

  const isBuildPage = location.pathname === '/build';
  const isWishlistPage = location.pathname === '/wishlist';

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="border-b bg-slate-950 border-slate-800 px-6 py-4 flex items-center justify-between">
      <h1
        className="text-xl font-bold tracking-tight text-white hover:cursor-pointer"
        onClick={() => navigate('/')}
      >
        MTG Deck Analyzer
      </h1>
      <div className="flex items-center gap-3">
        {!isWishlistPage && (
          <button
            onClick={() => navigate('/wishlist')}
            className="text-sm font-semibold text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-4 py-2 rounded-lg transition-colors hover:cursor-pointer"
          >
            ✨ Wishlist
          </button>
        )}

        {!isBuildPage && (
          <button
            onClick={() => navigate('/build')}
            className="bg-[#1971c2] hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors hover:cursor-pointer"
          >
            + New Deck
          </button>
        )}

        <button
          onClick={handleSignOut}
          className="text-sm font-semibold text-slate-500 hover:text-red-400 border border-slate-700 hover:border-red-400 px-4 py-2 rounded-lg transition-colors hover:cursor-pointer"
        >
          Sign Out
        </button>
      </div>
    </header>
  );
}
