import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "@/pages/HomePage";
import DeckBuilderPage from "@/pages/DeckBuilderPage";
import DeckDetailPage from "@/pages/DeckDetalPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/build" element={<DeckBuilderPage />} />
        <Route path="/build/:deckId" element={<DeckBuilderPage />} />
        <Route path="/deck/:deckId" element={<DeckDetailPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
