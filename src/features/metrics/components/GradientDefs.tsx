// Utils
import {
  gradientId,
  buildGradientStops,
} from "@/features/metrics/utils/chartColors";

// Types
import type { ColorGroup } from "@/features/metrics/types/metrics.types";

interface GradientDefsProps {
  groups: ColorGroup[];
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
