// Types
import type { Deck, DeckVersion } from '@/types';

interface VersionCardProps {
  version: DeckVersion;
  deck: Deck;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onEdit: () => void;
}

export default function VersionCard({
  version,
  deck,
  isSelected,
  onSelect,
  onDelete,
  onEdit,
}: VersionCardProps) {
  return (
    <div
      className="bg-slate-900 border rounded-xl p-4 flex flex-col gap-3 transition-colors"
      style={{ borderColor: isSelected ? '#1971c2' : '#1e293b' }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h3 className="text-white font-semibold text-sm">{version.name}</h3>
          <p className="text-slate-500 text-xs">
            {new Date(version.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={onEdit}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="text-xs text-slate-500 hover:text-red-400 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Note */}
      {version.note && (
        <p className="text-slate-400 text-xs leading-relaxed">{version.note}</p>
      )}

      {/* Swap summary */}
      <div className="flex flex-col gap-1">
        <p className="text-slate-500 text-xs uppercase tracking-widest">
          {version.swaps.length} swap{version.swaps.length !== 1 ? 's' : ''}
        </p>
        {version.swaps.slice(0, 3).map((swap, i) => {
          const outCard = deck.entries.find(
            (e) => e.card.id === swap.removeCardId,
          )?.card;
          return (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="text-red-400 truncate max-w-[120px]">
                − {outCard?.name ?? 'Unknown'}
              </span>
              <span className="text-slate-600">→</span>
              <span className="text-green-400 truncate max-w-[120px]">
                + {swap.addCard.name}
              </span>
            </div>
          );
        })}
        {version.swaps.length > 3 && (
          <p className="text-slate-600 text-xs">
            +{version.swaps.length - 3} more swap
            {version.swaps.length - 3 !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Select for compare */}
      <button
        onClick={onSelect}
        className="w-full text-xs font-semibold py-2 rounded-lg border transition-colors"
        style={{
          backgroundColor: isSelected ? '#1971c2' : 'transparent',
          borderColor: isSelected ? '#1971c2' : '#334155',
          color: isSelected ? '#fff' : '#64748b',
        }}
      >
        {isSelected ? 'Selected for Compare' : 'Select for Compare'}
      </button>
    </div>
  );
}
