import { ObjectId } from "mongodb";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getCollection, COLLECTIONS } from "@/lib/db";
import type { TicketDoc } from "@/lib/models/types";
import { serializeTicket } from "@/lib/serialize";
import { Card, CardHeader } from "@/components/ui/Card";
import { PriorityBadge, StatusBadge } from "@/components/ui/Badge";
import { TicketStatusControl } from "@/components/TicketStatusControl";
import { formatDate } from "@/lib/utils";

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const user = session!.user;

  if (!ObjectId.isValid(id)) notFound();

  const tickets = await getCollection<TicketDoc>(COLLECTIONS.tickets);
  const ticket = await tickets.findOne({ _id: new ObjectId(id) });

  if (!ticket) notFound();
  if (user.role === "user" && !ticket.userId.equals(new ObjectId(user.id))) notFound();

  const t = serializeTicket(ticket);
  const canManage = user.role === "agent" || user.role === "admin";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-zinc-50">{t.title}</h1>
            <p className="mt-1 text-sm text-zinc-500">{formatDate(t.createdAt)} · {t.email}</p>
          </div>
          <div className="flex gap-1.5">
            <PriorityBadge priority={t.ai?.priority ?? t.priority} />
            <StatusBadge status={t.status} />
          </div>
        </div>

        <p className="mt-4 whitespace-pre-wrap text-sm text-zinc-300">{t.description}</p>

        {canManage ? (
          <div className="mt-5 border-t border-surface-border pt-4">
            <TicketStatusControl ticketId={t.id} currentStatus={t.status} />
          </div>
        ) : null}
      </Card>

      {t.ai ? (
        <Card>
          <CardHeader title="Clasificación de la IA" />
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-zinc-500">Prioridad</dt>
              <dd className="mt-0.5 text-zinc-200">{t.ai.priority}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Categoría</dt>
              <dd className="mt-0.5 text-zinc-200">{t.ai.categoria}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Equipo asignado</dt>
              <dd className="mt-0.5 text-zinc-200">{t.ai.equipo}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Escalado</dt>
              <dd className="mt-0.5 text-zinc-200">{t.ai.escalar ? "Sí" : "No"}</dd>
            </div>
          </dl>
          {t.ai.resumen ? (
            <p className="mt-3 rounded-lg bg-surface p-3 text-sm text-zinc-300">{t.ai.resumen}</p>
          ) : null}
        </Card>
      ) : null}

      {t.aiAnswer ? (
        <Card>
          <CardHeader title="Respuesta automática" description="Generada por RAG desde la base de conocimiento" />
          <p className="whitespace-pre-wrap text-sm text-zinc-300">{t.aiAnswer}</p>
        </Card>
      ) : null}
    </div>
  );
}
