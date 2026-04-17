import { useState } from "react";

// Types
import type { Deck, ScryfallCard } from "@/types";

// Components
import CardSearchPanel from "@/features/deckBuilder/components/CardSearchPanel";

interface WishlistAddPanelProps {
  onAdd: (card: ScryfallCard, note?: string) => void;
  existingCardIds: string[];
  allDecks: Deck[];
}

export default function WishlistAddPanel({
  onAdd,
  existingCardIds,
}: WishlistAddPanelProps) {
  const [pending, setPending] = useState<ScryfallCard | null>(null);
  const [note, setNote] = useState("");

  const handleSelect = (card: ScryfallCard) => {
    if (existingCardIds.includes(card.id)) return;
    setPending(card);
  };

  const handleAdd = () => {
    if (!pending) return;
    onAdd(pending, note);
    setPending(null);
    setNote("");
  };

  return (
    <div className="flex flex-col gap-4">
      <CardSearchPanel
        label="Search for a card to wishlist"
        placeholder="Type a card name..."
        onSelectCard={handleSelect}
      />

      {pending && (
        <div className="card bg-base-100 border-2 border-primary/30 shadow-xl animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="card-body p-4 gap-4">
            <div className="flex items-center gap-4">
              <div className="avatar">
                <div className="w-16 rounded-lg ring ring-primary ring-offset-base-100 ring-offset-2">
                  {pending.image_uris?.small ? (
                    <img src={pending.image_uris.small} alt={pending.name} />
                  ) : (
                    <div className="bg-neutral text-neutral-content flex items-center justify-center h-full">
                      <span className="text-xs">MTG</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="min-w-0">
                <h3 className="font-bold text-lg truncate">{pending.name}</h3>
                <p className="text-xs opacity-60 uppercase tracking-tighter font-semibold">
                  {pending.type_line}
                </p>
              </div>
            </div>

            <div className="form-control w-full">
              <label className="label py-1">
                <span className="label-text-alt font-bold opacity-50">
                  WHY THIS CARD?
                </span>
              </label>
              <input
                type="text"
                autoFocus
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. For the token subtheme..."
                className="input input-bordered input-sm w-full focus:input-primary"
              />
            </div>

            <div className="card-actions justify-end">
              <button
                onClick={() => {
                  setPending(null);
                  setNote("");
                }}
                className="btn btn-ghost btn-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                className="btn btn-primary btn-sm px-6"
              >
                Add to Wishlist
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
