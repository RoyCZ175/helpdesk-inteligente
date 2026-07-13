import { config } from "dotenv";
config({ path: ".env.local" });

const { getCollection, COLLECTIONS } = await import("../lib/db.ts");
const { embedText } = await import("../lib/gemini.ts");
import type { KbArticleDoc } from "../lib/models/types.ts";

const SAMPLE_ARTICLES: Array<Pick<KbArticleDoc, "title" | "content" | "tags">> = [
  {
    title: "Cómo conectarse a la VPN",
    content:
      "1. Abre la aplicación de VPN corporativa.\n2. Selecciona el servidor 'Oficina Principal'.\n3. Ingresa tu usuario y contraseña de red.\n4. Haz clic en Conectar y espera el ícono verde.\nSi no conecta, verifica tu conexión a internet y reinicia la aplicación.",
    tags: ["vpn", "red", "acceso-remoto"],
  },
  {
    title: "Restablecer mi contraseña de usuario",
    content:
      "1. Entra al portal de autoservicio en portal.empresa.com/reset.\n2. Ingresa tu correo corporativo.\n3. Revisa tu email y sigue el enlace de restablecimiento (válido 30 minutos).\n4. Elige una contraseña de al menos 12 caracteres.\nSi no te llega el correo, revisa spam o contacta a soporte.",
    tags: ["contraseña", "acceso", "cuenta"],
  },
  {
    title: "La impresora no imprime o saca hojas en blanco",
    content:
      "1. Verifica que el cartucho de tóner/tinta no esté vacío.\n2. Revisa que el cable de red o USB esté bien conectado.\n3. Reinicia la impresora (apaga 10 segundos y enciende).\n4. En Windows, ve a Configuración > Impresoras y ejecuta 'Solución de problemas'.\nSi el problema persiste, es probable que sea un tema de hardware y se debe crear un ticket para el equipo de soporte físico.",
    tags: ["impresora", "hardware"],
  },
  {
    title: "No tengo señal de Wi-Fi en la oficina",
    content:
      "1. Verifica que el Wi-Fi esté activado en tu equipo.\n2. Olvida la red 'Empresa-WiFi' y vuelve a conectarte con tu contraseña de red.\n3. Acércate a un punto de acceso (AP) si estás en una zona con poca señal.\n4. Reinicia el adaptador de red desde el Administrador de dispositivos.\nSi varias personas reportan lo mismo en la misma zona, puede ser una caída del punto de acceso: escala como infraestructura.",
    tags: ["wifi", "red"],
  },
  {
    title: "Cómo solicitar la instalación de un nuevo software",
    content:
      "1. Verifica que el software esté en el catálogo aprobado (portal.empresa.com/software).\n2. Si está en el catálogo, instálalo tú mismo desde el Portal de Aplicaciones.\n3. Si no está en el catálogo, crea un ticket de tipo 'software' explicando para qué lo necesitas; el equipo de Level 2 evalúa la licencia y seguridad antes de aprobar.",
    tags: ["software", "instalacion"],
  },
];

async function main() {
  const articles = await getCollection<KbArticleDoc>(COLLECTIONS.kbArticles);
  const now = new Date();

  for (const article of SAMPLE_ARTICLES) {
    const existing = await articles.findOne({ title: article.title });
    if (existing) {
      console.log(`↷ Ya existe: "${article.title}"`);
      continue;
    }

    const embedding = await embedText(`${article.title}\n${article.content}`);
    await articles.insertOne({
      ...article,
      embedding,
      createdAt: now,
      updatedAt: now,
    });
    console.log(`✔ Insertado: "${article.title}"`);
  }

  console.log("\nListo. Recuerda crear el índice de vector search (npm run create:indexes).");
  process.exit(0);
}

main().catch((error) => {
  console.error("Error sembrando la base de conocimiento:", error);
  process.exit(1);
});
