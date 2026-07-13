import { z } from "zod";

export const priorityEnum = z.enum(["baja", "media", "alta", "critica"]);

export const registerSchema = z.object({
  name: z.string().trim().min(2, "El nombre es muy corto").max(80),
  email: z.string().trim().toLowerCase().email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email inválido"),
  password: z.string().min(1, "Ingresa tu contraseña"),
});

export const createTicketSchema = z.object({
  title: z.string().trim().min(5, "El título es muy corto").max(150),
  description: z.string().trim().min(10, "Describe el problema con más detalle").max(4000),
  priority: priorityEnum,
});

export const similarCheckSchema = z.object({
  title: z.string().trim().min(3),
  description: z.string().trim().min(3),
});

export const updateTicketStatusSchema = z.object({
  status: z.enum(["open", "in_progress", "resolved", "closed"]),
});

export const kbArticleSchema = z.object({
  title: z.string().trim().min(3).max(150),
  content: z.string().trim().min(20).max(8000),
  tags: z.array(z.string().trim().min(1)).max(10).default([]),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type KbArticleInput = z.infer<typeof kbArticleSchema>;
