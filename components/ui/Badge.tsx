import { cn } from "@/lib/utils";
import type { Priority, TicketStatus } from "@/lib/models/types";

export function PriorityBadge({ priority }: { priority: Priority }) {
  const styles: Record<Priority, string> = {
    critica: "bg-priority-critica/15 text-priority-critica border-priority-critica/30",
    alta: "bg-priority-alta/15 text-priority-alta border-priority-alta/30",
    media: "bg-priority-media/15 text-priority-media border-priority-media/30",
    baja: "bg-priority-baja/15 text-priority-baja border-priority-baja/30",
  };
  const labels: Record<Priority, string> = {
    critica: "Crítica",
    alta: "Alta",
    media: "Media",
    baja: "Baja",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        styles[priority],
      )}
    >
      {labels[priority]}
    </span>
  );
}

export function StatusBadge({ status }: { status: TicketStatus }) {
  const styles: Record<TicketStatus, string> = {
    open: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    in_progress: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    resolved_by_ai: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    resolved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    closed: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
  };
  const labels: Record<TicketStatus, string> = {
    open: "Abierto",
    in_progress: "En progreso",
    resolved_by_ai: "Resuelto por IA",
    resolved: "Resuelto",
    closed: "Cerrado",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        styles[status],
      )}
    >
      {labels[status]}
    </span>
  );
}
