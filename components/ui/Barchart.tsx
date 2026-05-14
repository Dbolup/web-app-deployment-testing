"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

export const description = "A stacked bar chart with a legend";

const FALLBACK_DATA = [
  { label: "Week 1", count: 0 },
  { label: "Week 2", count: 0 },
  { label: "Week 3", count: 0 },
  { label: "Week 4", count: 0 },
];

const chartConfig = {
  count: {
    label: "Tenders",
    color: "#00236f",
  },
} satisfies ChartConfig;

interface TrendPoint { date: string; count: number; }

export function groupTrendByWeek(trend: TrendPoint[]): { label: string; count: number }[] {
  if (!trend.length) return FALLBACK_DATA;
  const buckets: Record<string, number> = {};
  trend.forEach(({ date, count }) => {
    const d = new Date(date);
    const weekNum = Math.ceil((d.getDate()) / 7);
    const key = `${d.toLocaleString('default', { month: 'short' })} W${weekNum}`;
    buckets[key] = (buckets[key] ?? 0) + count;
  });
  return Object.entries(buckets).map(([label, count]) => ({ label, count }));
}

export function ChartBarStacked({ data }: { data?: { label: string; count: number }[] }) {
  const chartData = data?.length ? data : FALLBACK_DATA;
  return (
    <Card className="">
      <CardHeader />
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Bar
              dataKey="count"
              fill="var(--color-count)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
