// Modules
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Components
import ErrorBoundary from "@/components/ErrorBoundary/ErrorBoundary";

// Pages
import HomePage from "@/pages/HomePage";
import DeckBuilderPage from "@/pages/DeckBuilderPage";
import DeckDetailPage from "@/pages/DeckDetailPage";

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/build" element={<DeckBuilderPage />} />
          <Route path="/build/:deckId" element={<DeckBuilderPage />} />
          <Route path="/deck/:deckId" element={<DeckDetailPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
