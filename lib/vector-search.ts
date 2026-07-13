import { ObjectId } from "mongodb";
import { getCollection, COLLECTIONS } from "@/lib/db";
import { cosineSimilarity } from "@/lib/gemini";
import type {
  KbArticleDoc,
  SimilarKbResult,
  SimilarTicketResult,
  TicketDoc,
} from "@/lib/models/types";

// Nombres de los índices de Atlas Vector Search. Deben coincidir con los que
// crea scripts/create-vector-indexes.ts (o los que se creen a mano en Atlas).
export const TICKETS_VECTOR_INDEX = "tickets_vector_index";
export const KB_VECTOR_INDEX = "kb_vector_index";

// Umbrales de similitud coseno (0-1). Se calibran a ojo probando el proyecto;
// están centralizados aquí para ajustarlos en un solo lugar.
export const DUPLICATE_SIMILARITY_THRESHOLD = 0.88;
export const KB_MATCH_SIMILARITY_THRESHOLD = 0.8;

interface TicketVectorRow {
  _id: ObjectId;
  title: string;
  status: TicketDoc["status"];
  score: number;
}

interface KbVectorRow {
  _id: ObjectId;
  title: string;
  content: string;
  score: number;
}

export async function findSimilarTickets(
  embedding: number[],
  opts: { limit?: number; excludeId?: ObjectId } = {},
): Promise<SimilarTicketResult[]> {
  const tickets = await getCollection<TicketDoc>(COLLECTIONS.tickets);
  const limit = opts.limit ?? 3;

  try {
    const results = await tickets
      .aggregate<TicketVectorRow>([
        {
          $vectorSearch: {
            index: TICKETS_VECTOR_INDEX,
            path: "embedding",
            queryVector: embedding,
            numCandidates: 100,
            limit: limit + 1,
          },
        },
        {
          $project: {
            title: 1,
            status: 1,
            score: { $meta: "vectorSearchScore" },
          },
        },
      ])
      .toArray();

    return mapTicketRows(results, opts.excludeId, limit);
  } catch (error) {
    console.warn(
      "[vector-search] índice de tickets no disponible, usando fallback en memoria:",
      error instanceof Error ? error.message : error,
    );
    return findSimilarTicketsFallback(embedding, opts);
  }
}

async function findSimilarTicketsFallback(
  embedding: number[],
  opts: { limit?: number; excludeId?: ObjectId },
): Promise<SimilarTicketResult[]> {
  const tickets = await getCollection<TicketDoc>(COLLECTIONS.tickets);
  const limit = opts.limit ?? 3;
  const recent = await tickets
    .find({ embedding: { $exists: true } })
    .sort({ createdAt: -1 })
    .limit(300)
    .toArray();

  return recent
    .filter((t) => !opts.excludeId || !t._id!.equals(opts.excludeId))
    .map((t) => ({
      ticketId: t._id!.toString(),
      title: t.title,
      status: t.status,
      score: cosineSimilarity(embedding, t.embedding!),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function mapTicketRows(
  rows: TicketVectorRow[],
  excludeId: ObjectId | undefined,
  limit: number,
): SimilarTicketResult[] {
  return rows
    .filter((r) => !excludeId || !r._id.equals(excludeId))
    .slice(0, limit)
    .map((r) => ({
      ticketId: r._id.toString(),
      title: r.title,
      status: r.status,
      score: r.score,
    }));
}

export async function findBestKbMatch(
  embedding: number[],
): Promise<SimilarKbResult | null> {
  const articles = await getCollection<KbArticleDoc>(COLLECTIONS.kbArticles);

  try {
    const results = await articles
      .aggregate<KbVectorRow>([
        {
          $vectorSearch: {
            index: KB_VECTOR_INDEX,
            path: "embedding",
            queryVector: embedding,
            numCandidates: 50,
            limit: 1,
          },
        },
        {
          $project: {
            title: 1,
            content: 1,
            score: { $meta: "vectorSearchScore" },
          },
        },
      ])
      .toArray();

    return mapKbRow(results[0]);
  } catch (error) {
    console.warn(
      "[vector-search] índice de KB no disponible, usando fallback en memoria:",
      error instanceof Error ? error.message : error,
    );
    return findBestKbMatchFallback(embedding);
  }
}

async function findBestKbMatchFallback(
  embedding: number[],
): Promise<SimilarKbResult | null> {
  const articles = await getCollection<KbArticleDoc>(COLLECTIONS.kbArticles);
  const all = await articles.find({}).toArray();
  if (all.length === 0) return null;

  const scored = all
    .map((a) => ({ article: a, score: cosineSimilarity(embedding, a.embedding) }))
    .sort((a, b) => b.score - a.score);

  const best = scored[0];
  if (!best) return null;

  return {
    articleId: best.article._id!.toString(),
    title: best.article.title,
    content: best.article.content,
    score: best.score,
  };
}

function mapKbRow(row: KbVectorRow | undefined): SimilarKbResult | null {
  if (!row) return null;
  return {
    articleId: row._id.toString(),
    title: row.title,
    content: row.content,
    score: row.score,
  };
}
