import { NextResponse } from "next/server";
import { getCollection, COLLECTIONS } from "@/lib/db";
import type { KbArticleDoc } from "@/lib/models/types";
import { kbArticleSchema } from "@/lib/models/schemas";
import { embedText } from "@/lib/gemini";
import { serializeKbArticle } from "@/lib/serialize";
import { ApiError, handleApiError, requireRole } from "@/lib/session";

export async function GET() {
  try {
    await requireRole(["agent", "admin"]);
    const articles = await getCollection<KbArticleDoc>(COLLECTIONS.kbArticles);
    const results = await articles.find({}).sort({ createdAt: -1 }).toArray();
    return NextResponse.json({ articles: results.map(serializeKbArticle) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireRole(["admin"]);
    const body = await request.json().catch(() => null);
    const parsed = kbArticleSchema.safeParse(body);

    if (!parsed.success) {
      throw new ApiError(parsed.error.issues[0]?.message ?? "Datos inválidos", 400);
    }

    const embedding = await embedText(`${parsed.data.title}\n${parsed.data.content}`);
    const now = new Date();

    const articles = await getCollection<KbArticleDoc>(COLLECTIONS.kbArticles);
    const { insertedId } = await articles.insertOne({
      title: parsed.data.title,
      content: parsed.data.content,
      tags: parsed.data.tags,
      embedding,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json(
      {
        article: serializeKbArticle({
          _id: insertedId,
          title: parsed.data.title,
          content: parsed.data.content,
          tags: parsed.data.tags,
          embedding,
          createdAt: now,
          updatedAt: now,
        }),
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
