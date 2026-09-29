// Types
import type { CardSortKey } from "@/utils/sortCards";

interface ThenBySelectProps {
  options: { key: CardSortKey; label: string }[];
  primary: CardSortKey;
  value: CardSortKey | null;
  onChange: (key: CardSortKey | null) => void;
  className?: string;
}

// Secondary ("then by") sort picker; hides the primary key from its options.
export default function ThenBySelect({
  options,
  primary,
  value,
  onChange,
  className = "",
}: ThenBySelectProps) {
  return (
    <label className={`flex items-center gap-2 ${className}`}>
      <span className="text-xs font-bold opacity-60 whitespace-nowrap">
        AND
      </span>
      <select
        className="select select-sm select-bordered w-auto"
        value={value ?? ""}
        onChange={(e) =>
          onChange(e.target.value ? (e.target.value as CardSortKey) : null)
        }
      >
        <option value="">None</option>
        {options
          .filter((opt) => opt.key !== primary)
          .map((opt) => (
            <option key={opt.key} value={opt.key}>
              {opt.label}
            </option>
          ))}
      </select>
    </label>
  );
}
