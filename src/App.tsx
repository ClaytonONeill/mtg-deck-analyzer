// Modules
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Context
import { useAuth } from "@/hooks/useAuthContext";

// Components
import Header from "@/components/Header/Header";
import ErrorBoundary from "@/components/ErrorBoundary/ErrorBoundary";

// Pages
import HomePage from "@/pages/HomePage";
import DeckBuilderPage from "@/pages/DeckBuilderPage";
import DeckDetailPage from "@/pages/DeckDetailPage";
import WishlistPage from "@/pages/WishlistPage";
import LoginPage from "@/pages/LoginPage";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Header />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/build" element={<DeckBuilderPage />} />
          <Route path="/build/:deckId" element={<DeckBuilderPage />} />
          <Route path="/deck/:deckId" element={<DeckDetailPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
