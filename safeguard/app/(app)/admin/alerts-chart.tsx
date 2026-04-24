"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export function AlertsChart({
  data,
}: {
  data: { hour: string; count: number }[];
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 20, bottom: 0, left: -10 }}>
          <CartesianGrid
            stroke="var(--border)"
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            dataKey="hour"
            stroke="var(--muted-foreground)"
            fontSize={10}
            interval={3}
          />
          <YAxis
            stroke="var(--muted-foreground)"
            fontSize={10}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: "0.5rem",
              fontSize: "0.8rem",
            }}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke="var(--brand-pink)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
