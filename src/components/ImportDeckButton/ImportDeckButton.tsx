// Modules
import { useRef, useState } from 'react';

// Store
import { importDeckFromFile, deckStore } from '@/store/deckStore';

// Types
import type { Deck } from '@/types';

type ConflictChoice = 'keep' | 'overwrite';

interface ImportDeckButtonProps {
  onImported: (deck: Deck) => void;
}

export default function ImportDeckButton({
  onImported,
}: ImportDeckButtonProps) {
  // State
  const [error, setError] = useState<string | null>(null);
  const [conflictDeck, setConflictDeck] = useState<Deck | null>(null);
  const [incomingDeck, setIncomingDeck] = useState<Deck | null>(null);

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    try {
      const deck = await importDeckFromFile(file);
      const exists = (await deckStore.getById(deck.id)) ?? null;

      if (exists) {
        setConflictDeck(exists);
        setIncomingDeck(deck);
      } else {
        deckStore.save(deck);
        onImported(deck);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed.');
    } finally {
      // reset input so same file can be re-imported
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const resolveConflict = (choice: ConflictChoice) => {
    if (!incomingDeck) return;

    if (choice === 'overwrite') {
      deckStore.save(incomingDeck);
      onImported(incomingDeck);
    } else {
      // keep existing — assign a new ID to the incoming deck so both survive
      const deck = {
        ...incomingDeck,
        id: crypto.randomUUID(),
        name: `${incomingDeck.name} (imported)`,
      };
      deckStore.save(deck);
      onImported(deck);
    }

    setConflictDeck(null);
    setIncomingDeck(null);
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
      />

      <button
        onClick={() => inputRef.current?.click()}
        className="text-sm font-semibold text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-4 py-2 rounded-lg transition-colors"
      >
        Import Deck
      </button>

      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}

      {/* Conflict modal */}
      {conflictDeck && incomingDeck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h2 className="text-white font-bold text-lg mb-2">
              Deck Already Exists
            </h2>
            <p className="text-slate-400 text-sm mb-6">
              A deck named{' '}
              <span className="text-white font-semibold">
                "{conflictDeck.name}"
              </span>{' '}
              already exists in your library. What would you like to do?
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => resolveConflict('overwrite')}
                className="w-full bg-[#1971c2] hover:bg-blue-500 text-white font-semibold py-3 rounded-lg transition-colors text-sm"
              >
                Overwrite existing deck
              </button>
              <button
                onClick={() => resolveConflict('keep')}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 rounded-lg transition-colors text-sm"
              >
                Keep both{' '}
                <span className="text-slate-400 font-normal">
                  (imported copy renamed)
                </span>
              </button>
              <button
                onClick={() => {
                  setConflictDeck(null);
                  setIncomingDeck(null);
                }}
                className="w-full text-slate-500 hover:text-slate-300 text-sm py-2 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
