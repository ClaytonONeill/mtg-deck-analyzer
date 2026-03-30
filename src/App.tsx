// Modules
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Components
import Header from "@/components/Header/Header";
import ErrorBoundary from "@/components/ErrorBoundary/ErrorBoundary";

// Pages
import HomePage from "@/pages/HomePage";
import DeckBuilderPage from "@/pages/DeckBuilderPage";
import DeckDetailPage from "@/pages/DeckDetailPage";
import WishlistPage from "@/pages/WishlistPage";

export default function App() {
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
