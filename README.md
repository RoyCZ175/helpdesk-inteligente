# Help Desk Inteligente en la Nube

Help Desk con tickets, clasificación automática por IA (Gemini), respuestas RAG desde
una base de conocimiento, detección de tickets duplicados por similitud semántica,
autenticación con roles, dashboard de métricas, y automatizaciones (email, Slack/Discord,
Trello) orquestadas con **n8n**. 100% en tiers gratuitos, desplegado en Vercel.

## Arquitectura

```
Next.js (Vercel)  ── App Router: páginas + API routes
                      lib/gemini.ts   → clasifica, genera embeddings, responde RAG
                      lib/n8n.ts      → 1 webhook por evento de ticket

MongoDB Atlas (M0) ── tickets, users, kb_articles + 2 índices de Vector Search

Google Gemini API  ── clasificación (JSON estructurado) + embeddings + respuesta RAG

n8n Cloud           ── recibe el webhook → email siempre; si escalar=true → Slack/Discord + Trello
                        (las credenciales de esos servicios viven DENTRO de n8n, no en Vercel)
```

**Principio de diseño:** Next.js clasifica y persiste; n8n actúa sobre el mundo exterior
(email, Slack, Trello). Así las API keys de esos servicios nunca tocan el backend, y la
ejecución de cada automatización se puede ver en el log de n8n — útil para demostrar el
proyecto.

## Diferenciadores sobre el enunciado original

- **Next.js + TypeScript** en vez de HTML/JS plano + Express (un solo repo, tipado de punta a punta).
- **Auth con roles** (`user` / `agent` / `admin`) con Auth.js, rutas protegidas por middleware.
- **RAG sobre base de conocimiento**: si un ticket calza con un artículo existente
  (similitud coseno vía MongoDB Atlas Vector Search), Gemini responde al instante citando
  ese artículo y el ticket se autorresuelve — sin esperar a un agente.
- **Detección de tickets duplicados**: mientras el usuario escribe, se busca por similitud
  semántica contra tickets existentes y se le avisa antes de crear uno nuevo.
- **Automatización con n8n**: el backend nunca llama a Trello/Slack/email directamente; le
  avisa a n8n y n8n decide qué hacer según la clasificación de la IA.
- **Dashboard con métricas y gráficos**: % resuelto por IA, tiempo medio de resolución,
  tickets por categoría/prioridad, tendencia de 14 días.

## Requisitos

- [Node.js 20 LTS](https://nodejs.org) (revisa con `node --version`; este repo no tenía Node
  instalado al generarse — instálalo antes de seguir).
- Cuentas gratuitas: GitHub, Vercel, MongoDB Atlas, Google AI Studio, n8n Cloud, Trello.

## 1. Crear las cuentas y credenciales

### GitHub
Crea un repositorio vacío y sube este proyecto (`git init`, `git add .`, `git commit`,
`git push`). Vercel se conecta a este repo para desplegar automáticamente.

### MongoDB Atlas
1. Crea una cuenta en [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas/register).
2. Crea un cluster **M0 (Free)**.
3. En *Database Access*, crea un usuario con contraseña.
4. En *Network Access*, permite acceso desde `0.0.0.0/0` (o las IPs de Vercel).
5. Copia el connection string ("Connect" → "Drivers") y ponlo en `MONGODB_URI` (en
   `.env.local` para desarrollo, y en Vercel → Settings → Environment Variables para producción).
6. Después de tener datos (ver paso 4 más abajo), crea los índices de **Atlas Vector Search**
   corriendo `npm run create:indexes`. Si tu plan no permite crearlos por driver, el script
   imprime el JSON exacto para pegarlo a mano en Atlas → *Search* → *Create Search Index* →
   *JSON Editor*, sobre las colecciones `tickets` y `kb_articles`.

### Google AI Studio (Gemini)
1. Entra a [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey).
2. Crea una API key y ponla en `GEMINI_API_KEY`.
3. Tier gratuito: ~1500 requests/día en `gemini-2.0-flash`, más que suficiente para una demo.

### Auth.js
Genera un secreto y ponlo en `NEXTAUTH_SECRET`:
```
npx auth secret
```
(o cualquier cadena aleatoria larga, p.ej. `openssl rand -base64 32`).

### n8n Cloud
1. Crea una cuenta gratuita en [n8n.io](https://n8n.io) (free trial de n8n Cloud).
2. Ve a *Workflows* → *Import from File* y sube [`n8n/workflows/helpdesk-automation.json`](n8n/workflows/helpdesk-automation.json).
3. Abre el nodo **Validar secreto** y reemplaza `REPLACE_WITH_YOUR_SECRET` por un valor
   aleatorio propio — el mismo que vas a poner en `N8N_WEBHOOK_SECRET`.
4. Configura credenciales:
   - **Enviar email**: nodo SMTP (puedes usar Gmail con contraseña de aplicación, o
     cualquier proveedor con tier gratuito como Brevo).
   - **Notificar Slack/Discord**: pega tu Incoming Webhook URL de Slack o Discord en el
     campo `url` del nodo HTTP Request.
   - **Crear tarjeta en Trello**: credenciales de Trello (ver siguiente sección) + el
     `listId` del tablero donde quieres que caigan los tickets urgentes.
5. Activa el workflow (toggle arriba a la derecha).
6. Copia la URL del nodo **Webhook** en modo *Production* → `N8N_WEBHOOK_URL`.

### Trello
1. Genera tu API key en [trello.com/power-ups/admin](https://trello.com/power-ups/admin) y
   un token con permisos de escritura.
2. Crea un tablero "Help Desk" con una lista "Urgentes"; copia el ID de esa lista (abre la
   lista, `.json` al final de la URL del tablero, o usa la extensión "Card numbers").
3. Carga esas credenciales dentro del nodo Trello en n8n (no van en Vercel).

## 2. Configurar el proyecto localmente

```bash
npm install
cp .env.example .env.local   # y completa cada variable
npm run seed:kb               # siembra artículos de ejemplo en la base de conocimiento
npm run create:indexes        # crea los índices de Atlas Vector Search
npm run create:admin          # crea tu primer usuario admin (usa ADMIN_EMAIL/ADMIN_PASSWORD de .env.local)
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

Para convertir un usuario ya registrado en agente:
```bash
npm run set:role -- alguien@empresa.com agent
```

## 3. Desplegar en Vercel

1. Importa el repo de GitHub en [vercel.com/new](https://vercel.com/new).
2. Copia todas las variables de `.env.example` a Vercel → Settings → Environment Variables
   (usa la URL real de producción para `NEXTAUTH_URL`, p.ej. `https://tu-proyecto.vercel.app`).
3. Deploy. Cada push a `main` vuelve a desplegar automáticamente.
4. Corre `npm run create:admin` y `npm run seed:kb` apuntando tu `.env.local` al mismo
   `MONGODB_URI` de producción (son scripts locales que escriben directo a Atlas).

## Estructura del proyecto

```
/app
  /(landing, login, register)      páginas públicas
  /tickets, /tickets/[id]          usuario: crear y ver tickets
  /agent                           agente/admin: todos los tickets
  /admin/kb                        admin: base de conocimiento (RAG)
  /dashboard                       agente/admin: métricas y gráficos
  /api/tickets, /api/tickets/[id], /api/tickets/similar
  /api/kb, /api/kb/[id]
  /api/stats, /api/health
  /api/auth/[...nextauth], /api/auth/register
/lib
  db.ts              conexión a MongoDB (cacheada para serverless)
  gemini.ts          clasificación, embeddings, respuesta RAG
  vector-search.ts   $vectorSearch de Atlas + fallback en memoria
  ticket-service.ts  orquesta: embed → duplicados → RAG → clasificar → guardar → n8n
  n8n.ts             dispara el webhook de automatización
  auth.ts, session.ts, stats.ts, serialize.ts, utils.ts
  models/            tipos + esquemas Zod
/components          UI (formularios, tarjetas, badges, gráficos)
/n8n/workflows        workflow de n8n listo para importar
/scripts              seed-kb, create-vector-indexes, create-admin, set-role
```

## Flujo de un ticket

1. El usuario escribe el ticket; mientras tanto se busca por similitud si ya existe uno
   parecido (`POST /api/tickets/similar`, debounced).
2. Al enviar (`POST /api/tickets`): se genera el embedding, se busca un artículo de KB
   relevante y, si la similitud supera el umbral, Gemini responde con RAG y el ticket
   se autorresuelve (`status: resolved_by_ai`). Si no, Gemini clasifica prioridad,
   categoría, equipo y si debe escalarse.
3. El ticket se guarda en MongoDB.
4. Se notifica a n8n con el ticket ya clasificado. n8n manda el email siempre, y si
   `escalar = true`, además notifica a Slack/Discord y crea la tarjeta en Trello.
5. El agente ve el ticket en `/agent` y las métricas en `/dashboard`.

## Verificación end-to-end

- Registrar un usuario nuevo → crear un ticket normal → debe aparecer en "Mis tickets"
  con clasificación de la IA.
- Crear un ticket tipo "servidor caído" → debe marcar prioridad alta/crítica, escalar=true,
  y deberías ver la ejecución en el log de n8n (email + Slack/Discord + tarjeta en Trello).
- Crear un ticket que calce con un artículo de la base de conocimiento (p.ej. "¿cómo
  reinicio la VPN?") → debe autorresolverse con una respuesta generada por IA.
- Escribir un ticket muy parecido a uno que ya existe → debe avisar de la similitud antes
  de enviarlo.
- Iniciar sesión como agente/admin (`npm run set:role`) → ver `/agent` y `/dashboard` con
  datos reales, y `/admin/kb` (solo admin) para gestionar la base de conocimiento.
- Repetir el mismo recorrido contra la URL de producción de Vercel.

## Costos

Todos los servicios usados (Vercel, MongoDB Atlas M0, Google AI Studio, Trello) tienen
tier gratuito permanente. n8n Cloud se usa aquí con el free trial — para mantenerlo gratis
a largo plazo, la alternativa es self-host de n8n en Railway/Render (free tier) o localmente
con Docker; el workflow importado funciona igual en cualquiera de los dos.

## Notas / troubleshooting

- **`next-auth` está pineado al dist-tag `beta`** porque Auth.js v5 (necesario para App
  Router) estaba en beta al generarse este proyecto. Corre `npm ls next-auth` después de
  `npm install` para ver qué versión exacta quedó instalada; si ya salió v5 estable, puedes
  cambiar el valor en `package.json` a `"^5.0.0"`.
- **Los índices de Atlas Vector Search tardan uno o dos minutos** en pasar a estado "Active"
  después de `npm run create:indexes`. Mientras tanto, `lib/vector-search.ts` cae
  automáticamente a comparar embeddings en memoria, así que el proyecto funciona igual
  (más lento) aunque no esperes a que el índice esté listo.
- **Si Gemini cambia el nombre de sus modelos**, ajusta `GEMINI_MODEL` en tus variables de
  entorno (por defecto `gemini-2.0-flash`) sin tocar código.
- Los primeros tickets que crees no van a detectar duplicados/KB hasta que exista al menos
  un artículo (`npm run seed:kb`) o un ticket previo con embedding guardado.
