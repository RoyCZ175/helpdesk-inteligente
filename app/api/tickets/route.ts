import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { createTicketSchema } from "@/lib/models/schemas";
import { createTicket } from "@/lib/ticket-service";
import { getCollection, COLLECTIONS } from "@/lib/db";
import type { TicketDoc } from "@/lib/models/types";
import { serializeTicket } from "@/lib/serialize";
import { ApiError, handleApiError, requireUser } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json().catch(() => null);
    const parsed = createTicketSchema.safeParse(body);

    if (!parsed.success) {
      throw new ApiError(parsed.error.issues[0]?.message ?? "Datos inválidos", 400);
    }

    const ticket = await createTicket({
      ...parsed.data,
      userId: user.id,
      email: user.email ?? "",
    });

    return NextResponse.json({ ticket: serializeTicket(ticket) }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const tickets = await getCollection<TicketDoc>(COLLECTIONS.tickets);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const filter: Record<string, unknown> = {};
    if (user.role === "user") {
      filter.userId = new ObjectId(user.id);
    }
    if (status) {
      filter.status = status;
    }

    const results = await tickets.find(filter).sort({ createdAt: -1 }).limit(200).toArray();

    return NextResponse.json({ tickets: results.map(serializeTicket) });
  } catch (error) {
    return handleApiError(error);
  }
}
