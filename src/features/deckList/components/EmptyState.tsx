interface EmptyStateProps {
  onBuildDeck: () => void;
}

export default function EmptyState({ onBuildDeck }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <img
        className="w-40 mb-6 rounded-[4.75%/3.5%] -rotate-3 shadow-[0_0_40px_-8px_var(--color-primary)]"
        src="/mtg-card-image-back.jpeg"
        alt=""
      />
      <h2 className="font-display text-3xl font-bold tracking-wide text-base-content mb-2">
        Your library awaits
      </h2>
      <p className="text-base mb-8 max-w-sm">
        Build your first Commander deck to get started. Add cards, set your
        commander, and track your metrics.
      </p>
      <button
        onClick={onBuildDeck}
        className="btn btn-lg bg-primary hover:border-secondary text-primary-content"
      >
        Build Your First Deck
      </button>
    </div>
  );
}
