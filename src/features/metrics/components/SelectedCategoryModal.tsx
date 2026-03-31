import { X } from 'lucide-react';
import { useChartSelection } from '../hooks/useChartSelection';

export default function SelectedCategoryModal() {
  const { selectedCategory, setSelectedCategory, viewableEntries } =
    useChartSelection();

  if (!selectedCategory) return null;

  // CMC View Categories are strings of integers
  const CMC_VIEW = /^[0-9]+$/.test(selectedCategory);

  const filteredEntries = viewableEntries.filter((e) => {
    const cat = selectedCategory.toLowerCase();
    // Support both Type strings and CMC numbers (converted to strings)
    return (
      e.card.type_line.toLowerCase().includes(cat) ||
      Math.floor(e.card.cmc).toString() === cat
    );
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white capitalize">
              {CMC_VIEW
                ? `Converted Mana Cost ${selectedCategory}`
                : `${selectedCategory} Cards`}
            </h2>
            <p className="text-slate-400 text-sm">
              {filteredEntries.length} cards
            </p>
          </div>
          <button
            onClick={() => setSelectedCategory(null)}
            className="p-2 hover:bg-slate-800 rounded-full text-slate-400"
          >
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredEntries.map((entry) => (
            <div
              key={entry.card.id}
              className="flex flex-col items-center gap-3 bg-slate-800/50 p-3 rounded-lg border border-slate-700/50"
            >
              <img
                src={entry.card.image_uris?.large}
                alt={entry.card.name}
                className="w-3/4 object-contain"
              />
              <div className="flex flex-col items-center">
                <span className="text-sm font-medium text-slate-100">
                  {entry.card.name}
                </span>
                <span className="text-xs text-slate-500">
                  {entry.card.type_line.split('—')[0]}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
