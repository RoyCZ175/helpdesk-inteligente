import { getCollection, COLLECTIONS } from "@/lib/db";
import type { TicketDoc } from "@/lib/models/types";

export interface TicketStats {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  byCategoria: Record<string, number>;
  escalatedCount: number;
  resolvedByAiCount: number;
  avgResolutionHours: number | null;
  dailyTrend: { date: string; count: number }[];
}

export async function getTicketStats(): Promise<TicketStats> {
  const tickets = await getCollection<TicketDoc>(COLLECTIONS.tickets);

  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const [
    total,
    byStatus,
    byPriority,
    byCategoria,
    escalatedCount,
    resolvedByAiCount,
    resolutionStats,
    dailyTrend,
  ] = await Promise.all([
    tickets.countDocuments({}),
    tickets
      .aggregate<{ _id: string; count: number }>([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ])
      .toArray(),
    tickets
      .aggregate<{ _id: string; count: number }>([
        { $match: { "ai.priority": { $exists: true } } },
        { $group: { _id: "$ai.priority", count: { $sum: 1 } } },
      ])
      .toArray(),
    tickets
      .aggregate<{ _id: string; count: number }>([
        { $match: { "ai.categoria": { $exists: true } } },
        { $group: { _id: "$ai.categoria", count: { $sum: 1 } } },
      ])
      .toArray(),
    tickets.countDocuments({ "ai.escalar": true }),
    tickets.countDocuments({ status: "resolved_by_ai" }),
    tickets
      .aggregate<{ avgHours: number }>([
        { $match: { resolvedAt: { $exists: true } } },
        {
          $project: {
            hours: {
              $divide: [{ $subtract: ["$resolvedAt", "$createdAt"] }, 1000 * 60 * 60],
            },
          },
        },
        { $group: { _id: null, avgHours: { $avg: "$hours" } } },
      ])
      .toArray(),
    tickets
      .aggregate<{ _id: string; count: number }>([
        { $match: { createdAt: { $gte: fourteenDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray(),
  ]);

  return {
    total,
    byStatus: Object.fromEntries(byStatus.map((s) => [s._id, s.count])),
    byPriority: Object.fromEntries(byPriority.map((s) => [s._id, s.count])),
    byCategoria: Object.fromEntries(byCategoria.map((s) => [s._id, s.count])),
    escalatedCount,
    resolvedByAiCount,
    avgResolutionHours: resolutionStats[0]?.avgHours ?? null,
    dailyTrend: dailyTrend.map((d) => ({ date: d._id, count: d.count })),
  };
}
