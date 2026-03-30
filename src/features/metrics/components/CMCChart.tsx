// Modules
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Hooks
import { useChartSelection } from "../hooks/useChartSelection";

// Utils
import {
  getFillForKey,
  collectMulticolorGroups,
} from "@/features/metrics/utils/chartColors";

// Component
import CustomTooltip from "./CustomTooltip";
import GradientDefs from "@/features/metrics/components/GradientDefs";

// Types
import type { CMCDataPoint } from "@/features/metrics/types/metrics.types";

interface CMCChartProps {
  data: CMCDataPoint[];
}

function getAllColorKeys(data: CMCDataPoint[]): string[] {
  const seen = new Set<string>();
  for (const point of data) {
    for (const group of point.groups) {
      const key =
        group.colorKey === "multicolor"
          ? group.colors.slice().sort().join("")
          : group.colorKey;
      seen.add(key);
    }
  }
  return Array.from(seen);
}

function flattenPoint(
  point: CMCDataPoint,
): Record<string, number> & { cmc: number } {
  const flat: Record<string, number> & { cmc: number } = { cmc: point.cmc };
  for (const group of point.groups) {
    const key =
      group.colorKey === "multicolor"
        ? group.colors.slice().sort().join("")
        : group.colorKey;
    flat[key] = (flat[key] ?? 0) + group.count;
  }
  return flat;
}

export default function CMCChart({ data }: CMCChartProps) {
  const { setSelectedCategory, isStacked } = useChartSelection();

  if (data.length === 0) {
    return (
      <div className="h-75 flex items-center justify-center text-slate-500 text-sm">
        No cards in deck yet.
      </div>
    );
  }

  const colorKeys = getAllColorKeys(data);
  const flatData = data.map(flattenPoint);
  const multicolorGroups = collectMulticolorGroups(data);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={flatData}
        margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
        barGap={isStacked ? 0 : 2}
      >
        <GradientDefs groups={multicolorGroups} />
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#334155"
          vertical={false}
        />
        <XAxis
          dataKey="cmc"
          tick={{ fill: "#94a3b8", fontSize: 12 }}
          axisLine={{ stroke: "#334155" }}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: "#94a3b8", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          content={
            <CustomTooltip
              active={false}
              payload={[]}
              coordinate={undefined}
              accessibilityLayer={false}
              activeIndex={undefined}
              chartType="cmc"
            />
          }
          cursor={{ fill: "rgba(255,255,255, 0.1)" }}
        />
        ;
        {colorKeys.map((key) => (
          <Bar
            key={key}
            dataKey={key}
            // Logic: if isStacked is true, they share "a". If false, no stackId.
            stackId={isStacked ? "a" : undefined}
            fill={getFillForKey(data, key)}
            radius={isStacked ? [0, 0, 0, 0] : [4, 4, 0, 0]}
            maxBarSize={isStacked ? 32 : 12}
            style={{ cursor: "pointer" }}
            onClick={(entry) => {
              if (entry?.payload)
                setSelectedCategory(entry.payload.cmc.toString());
            }}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
