import { getCollection, COLLECTIONS } from "@/lib/db";
import type { KbArticleDoc } from "@/lib/models/types";
import { serializeKbArticle } from "@/lib/serialize";
import { KbManager } from "@/components/KbManager";
import { CardHeader } from "@/components/ui/Card";

export default async function AdminKbPage() {
  const articles = await getCollection<KbArticleDoc>(COLLECTIONS.kbArticles);
  const results = await articles.find({}).sort({ createdAt: -1 }).toArray();

  return (
    <div>
      <CardHeader
        title="Base de conocimiento"
        description="Artículos que Gemini usa para responder preguntas frecuentes automáticamente (RAG)"
      />
      <KbManager initialArticles={results.map(serializeKbArticle)} />
    </div>
  );
}
