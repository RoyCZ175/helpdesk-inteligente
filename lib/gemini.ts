import { GoogleGenAI, Type } from "@google/genai";
import type { AiClassification, Categoria, Equipo, Priority } from "@/lib/models/types";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("Falta la variable de entorno GEMINI_API_KEY");
}

const genAI = new GoogleGenAI({ apiKey });

const CLASSIFIER_MODEL = process.env.GEMINI_MODEL ?? "gemini-flash-latest";
const EMBEDDING_MODEL = "gemini-embedding-001";
// Debe coincidir con numDimensions en scripts/create-vector-indexes.mts.
const EMBEDDING_DIMENSIONS = 768;

// Los modelos "-latest" de Gemini traen razonamiento extendido activado por
// defecto, lo que puede añadir varios segundos por llamada. No lo necesitamos
// para clasificar un ticket o redactar una respuesta corta.
const NO_THINKING = { thinkingBudget: 0 } as const;

/** Reintenta una vez si Gemini devuelve un error transitorio (503/429, alta
 * demanda o rate limit) — pasa cualquier otro error de inmediato. */
async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    const status = (error as { status?: number })?.status;
    const isTransient = status === 503 || status === 429;
    if (!isTransient) throw error;

    await new Promise((resolve) => setTimeout(resolve, 1000));
    return fn();
  }
}

const SYSTEM_INSTRUCTION = `Eres el agente de clasificación de un Help Desk de TI.
Tu único trabajo es leer un ticket (título + descripción) y clasificarlo. No inventes
información que el ticket no da. Reglas:
- "critica": caídas totales de servicio, servidores o sistemas inaccesibles para todos.
- "alta": un usuario no puede trabajar (sin acceso, sin red, equipo dañado) o hay riesgo de seguridad.
- "media": funcionalidad parcial afectada (una app falla, una impresora, lentitud).
- "baja": dudas, solicitudes de acceso no urgentes, cómo-hacer-algo.
"escalar" debe ser true solo si prioridad es "alta" o "critica", o si detectas riesgo de
seguridad/datos. "equipo" indica quién debe atenderlo. "resumen" es una frase breve (<140
caracteres) en español, útil para una tarjeta de Trello.`;

const classificationSchema = {
  type: Type.OBJECT,
  properties: {
    priority: {
      type: Type.STRING,
      enum: ["baja", "media", "alta", "critica"],
    },
    categoria: {
      type: Type.STRING,
      enum: ["hardware", "software", "red", "acceso", "infraestructura", "otro"],
    },
    equipo: {
      type: Type.STRING,
      enum: ["level1", "level2", "devops", "infraestructura"],
    },
    escalar: { type: Type.BOOLEAN },
    resumen: { type: Type.STRING },
  },
  required: ["priority", "categoria", "equipo", "escalar", "resumen"],
};

export async function classifyTicket(input: {
  title: string;
  description: string;
  userPriority: Priority;
}): Promise<AiClassification> {
  const prompt = `Ticket a clasificar:
Título: ${input.title}
Descripción: ${input.description}
Prioridad que seleccionó el usuario (puede estar mal calibrada, ajústala si hace falta): ${input.userPriority}`;

  const result = await withRetry(() =>
    genAI.models.generateContent({
      model: CLASSIFIER_MODEL,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: classificationSchema,
        temperature: 0.2,
        thinkingConfig: NO_THINKING,
      },
    }),
  );

  const text = result.text;
  if (!text) {
    throw new Error("Gemini no devolvió texto al clasificar el ticket");
  }

  return JSON.parse(text) as {
    priority: Priority;
    categoria: Categoria;
    equipo: Equipo;
    escalar: boolean;
    resumen: string;
  };
}

export async function embedText(text: string): Promise<number[]> {
  const result = await withRetry(() =>
    genAI.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: text,
      config: { outputDimensionality: EMBEDDING_DIMENSIONS },
    }),
  );

  const values = result.embeddings?.[0]?.values;
  if (!values) {
    throw new Error("Gemini no devolvió un embedding");
  }
  return values;
}

export async function answerFromArticle(input: {
  question: string;
  articleTitle: string;
  articleContent: string;
}): Promise<string> {
  const prompt = `Pregunta del usuario: ${input.question}

Artículo de la base de conocimiento: "${input.articleTitle}"
---
${input.articleContent}
---

Redacta la respuesta para el usuario.`;

  const result = await withRetry(() =>
    genAI.models.generateContent({
      model: CLASSIFIER_MODEL,
      contents: prompt,
      config: {
        systemInstruction: `Eres el asistente de Help Desk. Responde la pregunta del usuario
usando SOLO la información del artículo de la base de conocimiento que te doy. Si el
artículo no alcanza para responder con seguridad, dilo explícitamente. Sé breve, claro,
en español, con pasos numerados si aplica. No inventes datos fuera del artículo.`,
        temperature: 0.3,
        thinkingConfig: NO_THINKING,
      },
    }),
  );

  return (result.text ?? "").trim();
}

/** Similitud coseno entre dos vectores del mismo largo. Usado como respaldo cuando
 * no hay un índice de Atlas Vector Search disponible (p.ej. en desarrollo local
 * sin el índice creado todavía). */
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
