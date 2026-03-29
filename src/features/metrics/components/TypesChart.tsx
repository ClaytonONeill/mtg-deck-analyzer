// Modules
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// Utils
import { getFillForKey, collectMulticolorGroups } from '../utils/chartColors';

// Components
import CustomTooltip from './CustomTooltip';
import GradientDefs from '@/features/metrics/components/GradientDefs';

// Types
import type { TypeDataPoint } from '@/features/metrics/types/metrics.types';

interface TypesChartProps {
  data: TypeDataPoint[];
}

// Flatten all color groups across all categories to determine bar keys
function getAllColorKeys(data: TypeDataPoint[]): string[] {
  const seen = new Set<string>();
  for (const point of data) {
    for (const group of point.groups) {
      const key =
        group.colorKey === 'multicolor'
          ? group.colors.slice().sort().join('')
          : group.colorKey;
      seen.add(key);
    }
  }
  return Array.from(seen);
}

// Flatten groups into a keyed record for Recharts
function flattenPoint(
  point: TypeDataPoint,
): Record<string, number | string> & { category: string } {
  const flat: Record<string, number | string> & { category: string } = {
    category: point.category,
  };
  for (const group of point.groups) {
    const key =
      group.colorKey === 'multicolor'
        ? group.colors.slice().sort().join('')
        : group.colorKey;
    flat[key] = ((flat[key] as number) ?? 0) + group.count;
  }
  return flat;
}

export default function TypesChart({ data }: TypesChartProps) {
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
          dataKey="category"
          tick={{ fill: '#94a3b8', fontSize: 12 }}
          axisLine={{ stroke: '#334155' }}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: '#94a3b8', fontSize: 12 }}
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
              chartType="types"
            />
          }
          cursor={{ fill: 'rgba(255,255,255, 0.1)' }}
        />
        {colorKeys.map((key) => (
          <Bar
            key={key}
            dataKey={key}
            fill={getFillForKey(data, key)}
            radius={[4, 4, 0, 0]}
            maxBarSize={32}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
