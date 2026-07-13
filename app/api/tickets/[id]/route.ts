import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCollection, COLLECTIONS } from "@/lib/db";
import type { TicketDoc } from "@/lib/models/types";
import { serializeTicket } from "@/lib/serialize";
import { updateTicketStatusSchema } from "@/lib/models/schemas";
import { ApiError, handleApiError, requireRole, requireUser } from "@/lib/session";
import { buildTicketUrl, notifyN8n } from "@/lib/n8n";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await requireUser();
    if (!ObjectId.isValid(id)) {
      throw new ApiError("Ticket no encontrado", 404);
    }

    const tickets = await getCollection<TicketDoc>(COLLECTIONS.tickets);
    const ticket = await tickets.findOne({ _id: new ObjectId(id) });

    if (!ticket) {
      throw new ApiError("Ticket no encontrado", 404);
    }
    if (user.role === "user" && !ticket.userId.equals(new ObjectId(user.id))) {
      throw new ApiError("No autorizado", 403);
    }

    return NextResponse.json({ ticket: serializeTicket(ticket) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await requireRole(["agent", "admin"]);
    if (!ObjectId.isValid(id)) {
      throw new ApiError("Ticket no encontrado", 404);
    }

    const body = await request.json().catch(() => null);
    const parsed = updateTicketStatusSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(parsed.error.issues[0]?.message ?? "Datos inválidos", 400);
    }

    const tickets = await getCollection<TicketDoc>(COLLECTIONS.tickets);
    const now = new Date();
    const isClosing = parsed.data.status === "resolved" || parsed.data.status === "closed";

    const result = await tickets.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: parsed.data.status,
          updatedAt: now,
          ...(isClosing ? { resolvedAt: now } : {}),
        },
      },
      { returnDocument: "after" },
    );

    if (!result) {
      throw new ApiError("Ticket no encontrado", 404);
    }

    await notifyN8n({
      event: "ticket.status_changed",
      ticketId: result._id!.toString(),
      title: result.title,
      description: result.description,
      email: result.email,
      status: result.status,
      userPriority: result.priority,
      ai: result.ai,
      aiAnswer: result.aiAnswer,
      ticketUrl: buildTicketUrl(result._id!.toString()),
    });

    return NextResponse.json({ ticket: serializeTicket(result) });
  } catch (error) {
    return handleApiError(error);
  }
}
