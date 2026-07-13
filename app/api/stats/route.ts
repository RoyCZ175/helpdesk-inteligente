import { NextResponse } from "next/server";
import { getTicketStats } from "@/lib/stats";
import { handleApiError, requireRole } from "@/lib/session";

export async function GET() {
  try {
    await requireRole(["agent", "admin"]);
    const stats = await getTicketStats();
    return NextResponse.json(stats);
  } catch (error) {
    return handleApiError(error);
  }
}
