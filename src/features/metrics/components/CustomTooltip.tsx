// Types
import type { TooltipContentProps, TooltipPayloadEntry } from 'recharts';

type CustomTooltipProps = TooltipContentProps & {
  chartType: 'types' | 'cmc';
};

export default function CustomTooltip({
  active,
  payload,
  label,
  chartType,
}: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const tooltipLabel =
    chartType === 'cmc' ? `Cards with CMC ${label}` : `${label} Cards`;

  const totalCategoryCount = payload.reduce((acc, { value }) => {
    const numericValue =
      value === undefined || value === null ? 0 : Number(value);
    return acc + (Number.isNaN(numericValue) ? 0 : numericValue);
  }, 0);

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-[13px] p-2">
      <p className="font-bold mb-1">
        {tooltipLabel}: {totalCategoryCount}
      </p>
      {payload.map((entry: TooltipPayloadEntry, index: number) => (
        <p key={index} className="text-slate-100">
          {entry.name &&
            typeof entry.name === 'string' &&
            entry.name.toUpperCase()}
          : {entry.value}
        </p>
      ))}
    </div>
  );
}
