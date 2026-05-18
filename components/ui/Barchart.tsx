"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const FALLBACK_DATA = [
  { label: "W1", count: 0 },
  { label: "W2", count: 0 },
  { label: "W3", count: 0 },
  { label: "W4", count: 0 },
];

interface TrendPoint { date: string; count: number; }

export function groupTrendByWeek(trend: TrendPoint[]): { label: string; count: number }[] {
  if (!trend.length) return FALLBACK_DATA;
  const buckets: Record<string, number> = {};
  trend.forEach(({ date, count }) => {
    const d = new Date(date);
    const weekNum = Math.ceil(d.getDate() / 7);
    const key = `${d.toLocaleString('default', { month: 'short' })} W${weekNum}`;
    buckets[key] = (buckets[key] ?? 0) + count;
  });
  return Object.entries(buckets).map(([label, count]) => ({ label, count }));
}

export function groupTrendByMonth(trend: TrendPoint[]): { label: string; count: number }[] {
  if (!trend.length) return FALLBACK_DATA;
  const buckets: Record<string, number> = {};
  trend.forEach(({ date, count }) => {
    const d = new Date(date);
    const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
    buckets[key] = (buckets[key] ?? 0) + count;
  });
  return Object.entries(buckets).map(([label, count]) => ({ label, count }));
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function ChartTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-md text-sm">
      <p className="text-gray-500 font-medium mb-1">{label}</p>
      <p className="text-[#00236f] font-bold">{payload[0].value} tender{payload[0].value !== 1 ? 's' : ''}</p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="h-[220px] flex items-end gap-3 px-2">
      {[40, 65, 35, 80, 55, 70, 45, 60].map((h, i) => (
        <div
          key={i}
          className="flex-1 bg-gray-100 rounded-t animate-pulse"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

export function ChartBarStacked({
  data,
  loading,
}: {
  data?: { label: string; count: number }[];
  loading?: boolean;
}) {
  if (loading) return <LoadingSkeleton />;

  const chartData = data?.length ? data : FALLBACK_DATA;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="tenderGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#00236f" stopOpacity={0.18} />
            <stop offset="95%" stopColor="#00236f" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="#f3f4f6" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: '#9ca3af' }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11, fill: '#9ca3af' }}
          allowDecimals={false}
          width={40}
        />
        <Tooltip content={<ChartTooltip />} />
        <Area
          type="monotone"
          dataKey="count"
          stroke="#00236f"
          strokeWidth={2.5}
          fill="url(#tenderGradient)"
          dot={false}
          activeDot={{ r: 5, fill: '#00236f', strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
