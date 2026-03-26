import ManaSymbol from './ManaSymbol';

interface ColorPipProps {
  color: string; // 'W' | 'U' | 'B' | 'R' | 'G'
  size?: number;
}

export default function ColorPip({ color, size = 20 }: ColorPipProps) {
  return <ManaSymbol symbol={color} size={size} />;
}
