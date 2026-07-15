import Link from "next/link";
import { getCollection, COLLECTIONS } from "@/lib/db";
import type { TicketDoc, TicketStatus } from "@/lib/models/types";
import { serializeTicket } from "@/lib/serialize";
import { TicketCard } from "@/components/TicketCard";
import { DeleteTicketButton } from "@/components/DeleteTicketButton";
import { CardHeader } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

const statusFilters: { value: TicketStatus | "all"; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "open", label: "Abiertos" },
  { value: "in_progress", label: "En progreso" },
  { value: "resolved_by_ai", label: "Resueltos por IA" },
  { value: "resolved", label: "Resueltos" },
  { value: "closed", label: "Cerrados" },
];

export default async function AgentPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const status = resolvedSearchParams.status as TicketStatus | undefined;
  const tickets = await getCollection<TicketDoc>(COLLECTIONS.tickets);
  const filter = status ? { status } : {};
  const results = await tickets.find(filter).sort({ createdAt: -1 }).limit(200).toArray();
  const serialized = results.map(serializeTicket);

  return (
    <div>
      <CardHeader title="Panel de agente" description={`${serialized.length} tickets`} />

      <div className="mb-5 flex flex-wrap gap-2">
        {statusFilters.map((f) => {
          const href = f.value === "all" ? "/agent" : `/agent?status=${f.value}`;
          const active = (f.value === "all" && !status) || f.value === status;
          return (
            <Link
              key={f.value}
              href={href}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium",
                active
                  ? "border-accent bg-accent-muted text-accent"
                  : "border-surface-border text-zinc-400 hover:text-zinc-200",
              )}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      <div className="space-y-4">
        {serialized.length === 0 ? (
          <p className="text-sm text-zinc-500">No hay tickets en esta vista.</p>
        ) : (
          serialized.map((t) => (
            <div key={t.id} className="space-y-2">
              <TicketCard ticket={t} href={`/tickets/${t.id}`} />
              <div className="flex justify-end">
                <DeleteTicketButton ticketId={t.id} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
