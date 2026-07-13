"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardHeader } from "@/components/ui/Card";
import type { TicketStats } from "@/lib/stats";

const PRIORITY_COLORS: Record<string, string> = {
  critica: "#ef4444",
  alta: "#f97316",
  media: "#eab308",
  baja: "#22c55e",
};

const tooltipStyle = {
  backgroundColor: "#212126",
  border: "1px solid #34343c",
  borderRadius: 12,
  fontSize: 12,
  color: "#f4f4f5",
};

function toChartData(record: Record<string, number>) {
  return Object.entries(record).map(([name, value]) => ({ name, value }));
}

export function DashboardCharts({ stats }: { stats: TicketStats }) {
  const priorityData = toChartData(stats.byPriority);
  const categoriaData = toChartData(stats.byCategoria);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader title="Tickets por prioridad (IA)" />
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={priorityData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
              {priorityData.map((entry) => (
                <Cell key={entry.name} fill={PRIORITY_COLORS[entry.name] ?? "#71717a"} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <CardHeader title="Tickets por categoría" />
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={categoriaData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#34343c" />
            <XAxis dataKey="name" stroke="#71717a" fontSize={12} />
            <YAxis stroke="#71717a" fontSize={12} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#ffffff08" }} />
            <Bar dataKey="value" fill="#f5c518" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader title="Tickets creados (últimos 14 días)" />
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={stats.dailyTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#34343c" />
            <XAxis dataKey="date" stroke="#71717a" fontSize={11} />
            <YAxis stroke="#71717a" fontSize={12} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="count" stroke="#f5c518" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
