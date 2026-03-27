// Types
import type { TooltipContentProps, TooltipPayloadEntry } from "recharts";
import type {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";

export default function CustomTooltip({
  active,
  payload,
  label,
}: TooltipContentProps<ValueType, NameType>) {
  if (active && payload && payload.length) {
    const TOTAL_CATEGORY_COUNT = payload.reduce((acc, { value }) => {
      const numericValue =
        value === undefined || value === null ? 0 : Number(value);
      return acc + (Number.isNaN(numericValue) ? 0 : numericValue);
    }, 0);

    return (
      <div
        style={{
          backgroundColor: "#1e293b",
          border: "1px solid #334155",
          borderRadius: "8px",
          color: "#f1f5f9",
          fontSize: 13,
          padding: "8px",
        }}
      >
        <p style={{ margin: 0, fontWeight: "bold" }}>
          {label}: {TOTAL_CATEGORY_COUNT}
        </p>
        {payload.map((entry: TooltipPayloadEntry, index: number) => (
          <p key={index} style={{ margin: 0, color: "#f1f5f9" }}>
            {entry.name &&
              typeof entry.name === "string" &&
              entry.name.toUpperCase()}
            : {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
}
