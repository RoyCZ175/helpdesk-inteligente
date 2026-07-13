import { ObjectId } from "mongodb";
import { auth } from "@/lib/auth";
import { getCollection, COLLECTIONS } from "@/lib/db";
import type { TicketDoc } from "@/lib/models/types";
import { serializeTicket } from "@/lib/serialize";
import { TicketForm } from "@/components/TicketForm";
import { TicketCard } from "@/components/TicketCard";
import { CardHeader } from "@/components/ui/Card";

export default async function TicketsPage() {
  const session = await auth();
  const userId = session!.user.id;

  const tickets = await getCollection<TicketDoc>(COLLECTIONS.tickets);
  const mine = await tickets
    .find({ userId: new ObjectId(userId) })
    .sort({ createdAt: -1 })
    .toArray();
  const serialized = mine.map(serializeTicket);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <TicketForm />

      <div>
        <CardHeader title="Mis tickets" description={`${serialized.length} en total`} />
        <div className="space-y-3">
          {serialized.length === 0 ? (
            <p className="text-sm text-zinc-500">Todavía no has creado ningún ticket.</p>
          ) : (
            serialized.map((t) => <TicketCard key={t.id} ticket={t} href={`/tickets/${t.id}`} />)
          )}
        </div>
      </div>
    </div>
  );
}
