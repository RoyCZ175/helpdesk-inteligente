import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCollection, COLLECTIONS } from "@/lib/db";
import type { KbArticleDoc } from "@/lib/models/types";
import { ApiError, handleApiError, requireRole } from "@/lib/session";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await requireRole(["admin"]);
    if (!ObjectId.isValid(id)) {
      throw new ApiError("Artículo no encontrado", 404);
    }

    const articles = await getCollection<KbArticleDoc>(COLLECTIONS.kbArticles);
    const result = await articles.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      throw new ApiError("Artículo no encontrado", 404);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
