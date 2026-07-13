import Link from "next/link";
import { PriorityBadge, StatusBadge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import type { Priority, TicketStatus } from "@/lib/models/types";

export interface TicketSummary {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: TicketStatus;
  email: string;
  createdAt: string;
  ai: { priority: Priority; categoria: string; equipo: string; escalar: boolean } | null;
}

export function TicketCard({ ticket, href }: { ticket: TicketSummary; href: string }) {
  return (
    <Link
      href={href}
      className="block rounded-xl border border-surface-border bg-surface-soft p-4 transition-colors hover:border-accent/40 hover:bg-surface-raised"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-medium text-zinc-50">{ticket.title}</h3>
        <div className="flex shrink-0 gap-1.5">
          <PriorityBadge priority={ticket.ai?.priority ?? ticket.priority} />
          <StatusBadge status={ticket.status} />
        </div>
      </div>
      <p className="mt-1.5 line-clamp-2 text-sm text-zinc-400">{ticket.description}</p>
      <div className="mt-3 flex items-center gap-3 text-xs text-zinc-500">
        <span>{formatDate(ticket.createdAt)}</span>
        {ticket.ai ? <span>· {ticket.ai.categoria}</span> : null}
        {ticket.ai?.escalar ? <span className="text-orange-400">· escalado</span> : null}
      </div>
    </Link>
  );
}
