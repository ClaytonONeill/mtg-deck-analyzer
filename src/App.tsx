// Modules
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Context
import { useAuth } from "@/hooks/useAuthContext";
import { ThemeProvider } from "@/context/ThemeContext";

// Components
import Header from "@/components/Header/Header";
import ErrorBoundary from "@/components/ErrorBoundary/ErrorBoundary";

// Pages
import HomePage from "@/pages/HomePage";
import DeckBuilderPage from "@/pages/DeckBuilderPage";
import DeckDetailPage from "@/pages/DeckDetailPage";
import WishlistPage from "@/pages/WishlistPage";
import ObjectivesPage from "./pages/ObjetivesPage";
import LoginPage from "@/pages/LoginPage";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      // Rendered above ThemeProvider, but index.html applies the saved theme
      // before first paint, so these tokens are already themed.
      <div className="min-h-screen bg-base-100 page-glow flex flex-col gap-4 items-center justify-center">
        <span className="loading loading-ring loading-lg text-primary" />
        <p className="text-base-content/60 text-sm font-medium tracking-widest uppercase">
          Shuffling up...
        </p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <ThemeProvider>
      <BrowserRouter>
        <ErrorBoundary>
          <Header />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/build" element={<DeckBuilderPage />} />
            <Route path="/build/:deckId" element={<DeckBuilderPage />} />
            <Route path="/deck/:deckId" element={<DeckDetailPage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/objectives" element={<ObjectivesPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ErrorBoundary>
      </BrowserRouter>
    </ThemeProvider>
  );
}
