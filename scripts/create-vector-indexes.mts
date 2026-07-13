import { config } from "dotenv";
config({ path: ".env.local" });

// Imports dinámicos: se cargan recién aquí, después de que dotenv ya llenó
// process.env. Un `import` estático de estos módulos se "hoistea" por encima
// de la llamada a config() y rompe (lib/db.ts lee MONGODB_URI en el top-level).
const { getCollection, COLLECTIONS } = await import("../lib/db.ts");
const { TICKETS_VECTOR_INDEX, KB_VECTOR_INDEX } = await import("../lib/vector-search.ts");

// Truncamos los embeddings de Gemini (gemini-embedding-001) a 768 dimensiones
// (ver EMBEDDING_DIMENSIONS en lib/gemini.ts, deben coincidir).
const EMBEDDING_DIMENSIONS = 768;

function vectorIndexDefinition(path: string) {
  return {
    fields: [
      {
        type: "vector",
        path,
        numDimensions: EMBEDDING_DIMENSIONS,
        similarity: "cosine",
      },
    ],
  };
}

async function ensureIndex(collectionName: string, indexName: string) {
  const collection = await getCollection(collectionName);

  try {
    await collection.createSearchIndex({
      name: indexName,
      type: "vectorSearch",
      definition: vectorIndexDefinition("embedding"),
    });
    console.log(`✔ Índice "${indexName}" solicitado en "${collectionName}". Puede tardar unos minutos en quedar listo (revisa en Atlas > Search).`);
  } catch (error) {
    console.warn(
      `⚠ No se pudo crear "${indexName}" automáticamente (probablemente el cluster no lo soporta vía driver, ` +
        `o ya existe). Créalo a mano en Atlas → Search → Create Search Index → JSON Editor, colección "${collectionName}", con:\n`,
    );
    console.log(
      JSON.stringify(
        { name: indexName, type: "vectorSearch", definition: vectorIndexDefinition("embedding") },
        null,
        2,
      ),
    );
    console.warn("Detalle del error:", error instanceof Error ? error.message : error);
  }
}

async function ensureStandardIndexes() {
  const users = await getCollection(COLLECTIONS.users);
  await users.createIndex({ email: 1 }, { unique: true });

  const tickets = await getCollection(COLLECTIONS.tickets);
  await tickets.createIndex({ userId: 1, createdAt: -1 });
  await tickets.createIndex({ status: 1 });

  console.log("✔ Índices estándar (no vectoriales) asegurados.");
}

async function main() {
  await ensureStandardIndexes();
  await ensureIndex(COLLECTIONS.tickets, TICKETS_VECTOR_INDEX);
  await ensureIndex(COLLECTIONS.kbArticles, KB_VECTOR_INDEX);
  process.exit(0);
}

main().catch((error) => {
  console.error("Error creando índices:", error);
  process.exit(1);
});
