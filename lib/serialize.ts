import type { KbArticleDoc, TicketDoc } from "@/lib/models/types";

export function serializeTicket(ticket: TicketDoc & { _id?: unknown }) {
  return {
    id: String(ticket._id),
    title: ticket.title,
    description: ticket.description,
    priority: ticket.priority,
    email: ticket.email,
    userId: String(ticket.userId),
    status: ticket.status,
    ai: ticket.ai ?? null,
    aiAnswer: ticket.aiAnswer ?? null,
    duplicateOfId: ticket.duplicateOfId ? String(ticket.duplicateOfId) : null,
    trelloCardUrl: ticket.trelloCardUrl ?? null,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    resolvedAt: ticket.resolvedAt ? ticket.resolvedAt.toISOString() : null,
  };
}

export function serializeKbArticle(article: KbArticleDoc & { _id?: unknown }) {
  return {
    id: String(article._id),
    title: article.title,
    content: article.content,
    tags: article.tags,
    createdAt: article.createdAt.toISOString(),
  };
}
