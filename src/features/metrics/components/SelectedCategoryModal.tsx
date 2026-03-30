import { X } from "lucide-react";
import type { DeckEntry } from "@/types";

interface SelectedCategoryModalProps {
  category: string;
  entries: DeckEntry[];
  onClose: () => void;
}

export default function SelectedCategoryModal({
  category,
  entries,
  onClose,
}: SelectedCategoryModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">{category}</h2>
            <p className="text-slate-400 text-sm">
              {entries.length} cards in this category
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Card List */}
        <div className="overflow-y-auto p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {entries.map((entry) => (
            <div
              key={entry.card.id}
              className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-lg border border-slate-700/50"
            >
              <img
                src={
                  entry.card.image_uris?.small || entry.card.image_uris?.normal
                }
                alt={entry.card.name}
                className="w-12 h-16 object-contain rounded shadow-md"
              />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-slate-100 leading-tight">
                  {entry.card.name}
                </span>
                <span className="text-xs text-slate-500 mt-1">
                  {entry.card.type_line.split("—")[0]}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
