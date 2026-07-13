import type { AiClassification, TicketDoc } from "@/lib/models/types";

type N8nEvent = "ticket.created" | "ticket.resolved_by_ai" | "ticket.status_changed";

interface N8nPayload {
  event: N8nEvent;
  ticketId: string;
  title: string;
  description: string;
  email: string;
  status: TicketDoc["status"];
  userPriority: TicketDoc["priority"];
  ai?: AiClassification;
  aiAnswer?: string;
  ticketUrl: string;
}

/**
 * Notifica a n8n para que ejecute las acciones "hacia afuera" (email, Slack/Discord,
 * Trello). El backend nunca llama a esos servicios directamente: solo clasifica,
 * persiste y avisa. Si n8n no responde o falla, no debe tumbar la creación del ticket
 * — se registra el error y listo.
 */
export async function notifyN8n(payload: N8nPayload): Promise<void> {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  const secret = process.env.N8N_WEBHOOK_SECRET;

  if (!webhookUrl) {
    console.warn("[n8n] N8N_WEBHOOK_URL no configurado, se omite la notificación");
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(secret ? { "X-Helpdesk-Secret": secret } : {}),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!res.ok) {
      console.error(`[n8n] webhook respondió ${res.status}`);
    }
  } catch (error) {
    console.error("[n8n] no se pudo notificar el webhook", error);
  } finally {
    clearTimeout(timeout);
  }
}

export function buildTicketUrl(ticketId: string): string {
  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  return `${base}/tickets/${ticketId}`;
}
