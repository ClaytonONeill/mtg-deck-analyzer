import { X } from "lucide-react";

// Hooks
import { useChartSelection } from "../hooks/useChartSelection";

// Utils
import { BASIC_LAND_NAMES, configureBasicLandEndpoint } from "@/utils/utils";

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
    <div className="modal modal-open modal-bottom sm:modal-middle backdrop-blur-sm">
      <div className="modal-box max-w-3xl max-h-[85vh] p-0 bg-base-100 border border-base-content/10 shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 bg-base-200/50 border-b border-base-content/5">
          <div className="space-y-1">
            <h2 className="text-xl font-black italic tracking-tight text-base-content flex items-center gap-2">
              <span className="text-primary truncate uppercase">
                {CMC_VIEW ? `CMC ${selectedCategory}` : selectedCategory}
              </span>
              <span className="opacity-20 text-sm font-normal">/</span>
              <span className="text-sm opacity-50 font-bold uppercase tracking-widest">
                Analytics Detail
              </span>
            </h2>
            <div className="badge badge-sm badge-outline opacity-40 font-mono">
              {filteredEntries.length} Results Found
            </div>
          </div>

          <button
            onClick={() => setSelectedCategory(null)}
            className="btn btn-ghost btn-sm btn-circle hover:bg-error/10 hover:text-error transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content - Scrollable Grid */}
        <div className="overflow-y-auto p-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEntries.map((entry) => {
              const isBasicLand = BASIC_LAND_NAMES.includes(
                entry.card.name.toLowerCase(),
              );

              const imageSrc = isBasicLand
                ? configureBasicLandEndpoint(entry.card.name)
                : entry.card.image_uris?.large;

              return (
                <div
                  key={entry.card.id}
                  className="group flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-200"
                >
                  <div className="relative aspect-[63/88] w-full rounded-[4.75%/3.5%] overflow-hidden shadow-lg group-hover:shadow-primary/20 group-hover:ring-2 group-hover:ring-primary/50 transition-all">
                    <img
                      src={imageSrc}
                      alt={entry.card.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      loading="lazy"
                    />
                  </div>

                  <div className="flex flex-col px-1">
                    <span className="text-xs font-bold truncate text-base-content group-hover:text-primary transition-colors">
                      {entry.card.name}
                    </span>
                    <span className="text-[10px] uppercase font-black tracking-widest opacity-30">
                      {entry.card.type_line.split("—")[0]}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="modal-action p-4 bg-base-200/30 border-t border-base-content/5 mt-0">
          <button
            className="btn btn-sm btn-ghost opacity-50 hover:opacity-100"
            onClick={() => setSelectedCategory(null)}
          >
            Close Inspector
          </button>
        </div>
      </div>

      {/* Click outside to close backdrop */}
      <form
        method="dialog"
        className="modal-backdrop bg-black/60"
        onClick={() => setSelectedCategory(null)}
      >
        <button>close</button>
      </form>
    </div>
  );
}
