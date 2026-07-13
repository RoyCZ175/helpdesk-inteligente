import { getTicketStats } from "@/lib/stats";
import { KpiTile } from "@/components/ui/KpiTile";
import { DashboardCharts } from "@/components/charts/DashboardCharts";
import { CardHeader } from "@/components/ui/Card";

export default async function DashboardPage() {
  const stats = await getTicketStats();
  const resolvedByAiPct = stats.total > 0 ? Math.round((stats.resolvedByAiCount / stats.total) * 100) : 0;

  return (
    <div>
      <CardHeader title="Dashboard" description="Métricas del Help Desk en tiempo real" />

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <KpiTile label="Total tickets" value={String(stats.total)} />
        <KpiTile label="Abiertos" value={String(stats.byStatus.open ?? 0)} />
        <KpiTile
          label="Resueltos por IA"
          value={`${resolvedByAiPct}%`}
          hint={`${stats.resolvedByAiCount} tickets`}
          accent
        />
        <KpiTile label="Escalados" value={String(stats.escalatedCount)} />
        <KpiTile
          label="Resolución media"
          value={stats.avgResolutionHours ? `${stats.avgResolutionHours.toFixed(1)}h` : "—"}
        />
      </div>

      <DashboardCharts stats={stats} />
    </div>
  );
}
