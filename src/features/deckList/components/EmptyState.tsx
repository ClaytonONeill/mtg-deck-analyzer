interface EmptyStateProps {
  onBuildDeck: () => void;
}

export default function EmptyState({ onBuildDeck }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <img className="w-40 mb-6" src="/mtg-card-image-back.jpeg"></img>
      <h2 className="text-2xl font-bold text-white mb-2">No decks yet</h2>
      <p className="text-slate-400 mb-8 max-w-sm">
        Build your first Commander deck to get started. Add cards, set your
        commander, and track your metrics.
      </p>
      <button
        onClick={onBuildDeck}
        className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-lg transition-colors hover:cursor-pointer"
      >
        Build Your First Deck
      </button>
    </div>
  );
}
