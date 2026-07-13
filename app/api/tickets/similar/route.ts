import { NextResponse } from "next/server";
import { similarCheckSchema } from "@/lib/models/schemas";
import { checkSimilarTickets } from "@/lib/ticket-service";
import { DUPLICATE_SIMILARITY_THRESHOLD } from "@/lib/vector-search";
import { ApiError, handleApiError, requireUser } from "@/lib/session";

export async function POST(request: Request) {
  try {
    await requireUser();
    const body = await request.json().catch(() => null);
    const parsed = similarCheckSchema.safeParse(body);

    if (!parsed.success) {
      throw new ApiError(parsed.error.issues[0]?.message ?? "Datos inválidos", 400);
    }

    const results = await checkSimilarTickets(parsed.data.title, parsed.data.description);
    const matches = results.filter((r) => r.score >= DUPLICATE_SIMILARITY_THRESHOLD * 0.9);

    return NextResponse.json({ matches });
  } catch (error) {
    return handleApiError(error);
  }
}
