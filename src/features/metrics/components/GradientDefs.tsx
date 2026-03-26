import {
  gradientId,
  buildGradientStops,
} from '@/features/metrics/utils/chartColors';

import type { ColorGroup } from '@/features/metrics/types/metrics.types';

interface GradientDefsProps {
  groups: ColorGroup[];
}

// Collect all unique multicolor combinations across all data points
export function collectMulticolorGroups(
  dataPoints: { groups: ColorGroup[] }[],
): ColorGroup[] {
  const seen = new Set<string>();
  const result: ColorGroup[] = [];
  for (const point of dataPoints) {
    for (const group of point.groups) {
      if (group.colorKey !== 'multicolor') continue;
      const key = group.colors.slice().sort().join('');
      if (!seen.has(key)) {
        seen.add(key);
        result.push(group);
      }
    }
  }
  return result;
}

export default function GradientDefs({ groups }: GradientDefsProps) {
  return (
    <defs>
      {groups.map((group) => {
        const id = gradientId(group.colors);
        const stops = buildGradientStops(group.colors);
        return (
          <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
            {stops.map((stop) => (
              <stop
                key={stop.offset}
                offset={stop.offset}
                stopColor={stop.color}
              />
            ))}
          </linearGradient>
        );
      })}
    </defs>
  );
}
