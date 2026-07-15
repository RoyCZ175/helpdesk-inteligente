import { ObjectId } from "mongodb";
import { getCollection, COLLECTIONS } from "@/lib/db";
import { classifyTicket, embedText } from "@/lib/gemini";
import {
  DUPLICATE_SIMILARITY_THRESHOLD,
  KB_MATCH_SIMILARITY_THRESHOLD,
  findBestKbMatch,
  findSimilarTickets,
} from "@/lib/vector-search";
import { buildTicketUrl, notifyN8n } from "@/lib/n8n";
import type { CreateTicketInput } from "@/lib/models/schemas";
import type { TicketDoc } from "@/lib/models/types";

interface CreateTicketArgs extends CreateTicketInput {
  userId: string;
  email: string;
}

export async function createTicket(input: CreateTicketArgs) {
  const embedding = await embedText(`${input.title}\n${input.description}`);

  const [similar, kbMatch] = await Promise.all([
    findSimilarTickets(embedding, { limit: 3 }),
    findBestKbMatch(embedding),
  ]);

  const duplicate = similar.find((s) => s.score >= DUPLICATE_SIMILARITY_THRESHOLD);
  const canAutoResolve = kbMatch && kbMatch.score >= KB_MATCH_SIMILARITY_THRESHOLD;

  const now = new Date();
  const tickets = await getCollection<TicketDoc>(COLLECTIONS.tickets);

  const base: TicketDoc = {
    title: input.title,
    description: input.description,
    priority: input.priority,
    email: input.email,
    userId: new ObjectId(input.userId),
    status: "open",
    embedding,
    duplicateOfId: duplicate ? new ObjectId(duplicate.ticketId) : undefined,
    createdAt: now,
    updatedAt: now,
  };

  if (canAutoResolve && kbMatch) {
    const ai = await classifyTicket({
      title: input.title,
      description: input.description,
      userPriority: input.priority,
    });

    const shouldEscalate = ai.escalar || ai.priority === "critica";

    base.status = "resolved_by_ai";
    base.ai = { ...ai, escalar: shouldEscalate };
    base.aiAnswer = kbMatch.content;
    base.aiAnswerSourceId = new ObjectId(kbMatch.articleId);
    base.resolvedAt = now;
  } else {
    const ai = await classifyTicket({
      title: input.title,
      description: input.description,
      userPriority: input.priority,
    });
    base.status = "open";
    base.ai = ai;
  }

  const { insertedId } = await tickets.insertOne(base);

  await notifyN8n({
    event: base.status === "resolved_by_ai" ? "ticket.resolved_by_ai" : "ticket.created",
    ticketId: insertedId.toString(),
    title: base.title,
    description: base.description,
    email: base.email,
    status: base.status,
    userPriority: base.priority,
    ai: base.ai,
    aiAnswer: base.aiAnswer,
    ticketUrl: buildTicketUrl(insertedId.toString()),
  });

  return { ...base, _id: insertedId };
}

export async function checkSimilarTickets(title: string, description: string) {
  const embedding = await embedText(`${title}\n${description}`);
  return findSimilarTickets(embedding, { limit: 5 });
}
