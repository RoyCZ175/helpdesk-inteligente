import type { ObjectId } from "mongodb";

export type Role = "user" | "agent" | "admin";

export interface UserDoc {
  _id?: ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  createdAt: Date;
}

export type Priority = "baja" | "media" | "alta" | "critica";
export type Categoria =
  | "hardware"
  | "software"
  | "red"
  | "acceso"
  | "infraestructura"
  | "otro";
export type Equipo = "level1" | "level2" | "devops" | "infraestructura";

export type TicketStatus =
  | "open"
  | "in_progress"
  | "resolved_by_ai"
  | "resolved"
  | "closed";

export interface AiClassification {
  priority: Priority;
  categoria: Categoria;
  equipo: Equipo;
  escalar: boolean;
  resumen: string;
}

export interface TicketDoc {
  _id?: ObjectId;
  title: string;
  description: string;
  priority: Priority; // elegida por el usuario en el formulario
  email: string;
  userId: ObjectId;
  status: TicketStatus;
  ai?: AiClassification;
  aiAnswer?: string; // respuesta RAG cuando status = resolved_by_ai
  aiAnswerSourceId?: ObjectId; // artículo de KB usado como fuente
  embedding?: number[];
  duplicateOfId?: ObjectId;
  trelloCardUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

export interface KbArticleDoc {
  _id?: ObjectId;
  title: string;
  content: string;
  tags: string[];
  embedding: number[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SimilarTicketResult {
  ticketId: string;
  title: string;
  status: TicketStatus;
  score: number;
}

export interface SimilarKbResult {
  articleId: string;
  title: string;
  content: string;
  score: number;
}
