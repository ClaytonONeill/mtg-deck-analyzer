import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type {
  CMCDataPoint,
  ColorGroup,
} from "@/features/metrics/utils/deckMetrics";
import { barFill } from "@/features/metrics/utils/chartColors";
import GradientDefs, {
  collectMulticolorGroups,
} from "@/features/metrics/components/GradientDefs";

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

function groupForKey(
  groups: ColorGroup[],
  key: string,
): ColorGroup | undefined {
  return groups.find((g) => {
    const gKey =
      g.colorKey === "multicolor"
        ? g.colors.slice().sort().join("")
        : g.colorKey;
    return gKey === key;
  });
}

export default function CMCChart({ data }: CMCChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-slate-500 text-sm">
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
          label={{
            value: "Mana Value",
            position: "insideBottom",
            offset: -4,
            fill: "#64748b",
            fontSize: 11,
          }}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: "#94a3b8", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
          contentStyle={{
            backgroundColor: "#1e293b",
            border: "1px solid #334155",
            borderRadius: "8px",
            color: "#f1f5f9",
            fontSize: 13,
          }}
          labelFormatter={(label) => (label != null ? `CMC ${label}` : "")}
        />
        {colorKeys.map((key) => (
          <Bar key={key} dataKey={key} radius={[4, 4, 0, 0]} maxBarSize={32}>
            {flatData.map((point, i) => {
              const originalPoint = data[i];
              const group = groupForKey(originalPoint.groups, key);
              const fill = group
                ? barFill(group.colorKey, group.colors)
                : "transparent";
              return <Cell key={`${key}-${i}`} fill={fill} />;
            })}
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
