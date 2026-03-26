import type { CardCategory } from '@/types';

export type ColorKey = 'W' | 'U' | 'B' | 'R' | 'G' | 'multicolor' | 'colorless';

export interface ColorGroup {
  colorKey: ColorKey;
  colors: string[];
  count: number;
}

export interface TypeDataPoint {
  category: CardCategory;
  groups: ColorGroup[];
}

export interface CMCDataPoint {
  cmc: number;
  groups: ColorGroup[];
}

export interface TypesChartProps {
  data: TypeDataPoint[];
}
