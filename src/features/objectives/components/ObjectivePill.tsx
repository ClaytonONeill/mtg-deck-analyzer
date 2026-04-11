// Types
import type { Objective } from "@/types";

interface ObjectivePillProps {
  objective: Objective;
  onRemove?: () => void;
  size?: "sm" | "md";
}

export default function ObjectivePill({
  objective,
  onRemove,
  size = "sm",
}: ObjectivePillProps) {
  const padding = size === "sm" ? "px-2 py-0.5" : "px-3 py-1";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold text-sm ${padding}`}
      style={{
        backgroundColor: `${objective.color}22`,
        color: objective.color,
        border: `1px solid ${objective.color}55`,
      }}
    >
      {objective.label}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="hover:opacity-70 transition-opacity leading-none"
        >
          ×
        </button>
      )}
    </span>
  );
}
