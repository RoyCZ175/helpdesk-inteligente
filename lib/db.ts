import dns from "node:dns";
import { MongoClient, type Db, type Document } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("Falta la variable de entorno MONGODB_URI");
}

// Algunos resolutores DNS locales (routers domésticos, ciertas VPNs) no
// manejan bien las consultas SRV que usa "mongodb+srv://", aunque sí
// resuelven registros A normales — fallan con ECONNREFUSED solo en la
// consulta SRV. Forzamos un resolver público conocido para evitarlo, tanto
// en desarrollo como en producción (Vercel también puede alcanzar estos).
dns.setServers(["8.8.8.8", "1.1.1.1"]);

// En serverless (Vercel) cada invocación puede reutilizar el contexto del
// módulo entre llamadas "calientes" — cacheamos la promesa de conexión en
// global para no abrir una conexión nueva a Mongo en cada request.
declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const client = new MongoClient(uri);

const clientPromise: Promise<MongoClient> =
  global._mongoClientPromise ?? (global._mongoClientPromise = client.connect());

export async function getDb(): Promise<Db> {
  const connected = await clientPromise;
  return connected.db();
}

export async function getCollection<T extends Document = Document>(name: string) {
  const db = await getDb();
  return db.collection<T>(name);
}

export const COLLECTIONS = {
  users: "users",
  tickets: "tickets",
  kbArticles: "kb_articles",
} as const;
