import Link from "next/link";
import { redirect } from "next/navigation";
import { Bot, Cloud, Sparkles, Ticket, Workflow, Zap } from "lucide-react";
import { auth } from "@/lib/auth";
import { Card } from "@/components/ui/Card";

const features = [
  {
    icon: Ticket,
    title: "Tickets",
    description: "Los usuarios crean y rastrean solicitudes de soporte en segundos.",
  },
  {
    icon: Bot,
    title: "IA automática",
    description: "Gemini clasifica prioridad, categoría y equipo de cada ticket.",
  },
  {
    icon: Sparkles,
    title: "Respuestas con RAG",
    description: "Preguntas frecuentes resueltas al instante contra tu base de conocimiento.",
  },
  {
    icon: Workflow,
    title: "Automatización con n8n",
    description: "Email, Slack/Discord y Trello se disparan solos cuando algo es urgente.",
  },
  {
    icon: Cloud,
    title: "100% cloud",
    description: "Vercel, MongoDB Atlas, Google AI y n8n — sin servidores propios.",
  },
  {
    icon: Zap,
    title: "Costo cero",
    description: "Todos los servicios usados tienen un tier gratuito generoso.",
  },
];

export default async function LandingPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/tickets");
  }

  return (
    <div className="space-y-16 py-8">
      <section className="grid items-center gap-10 md:grid-cols-2">
        <div>
          <span className="inline-block rounded-full border border-accent/30 bg-accent-muted px-3 py-1 text-xs font-medium text-accent">
            Proyecto cloud con IA
          </span>
          <h1 className="mt-4 text-4xl font-bold leading-tight text-zinc-50 sm:text-5xl">
            Help Desk <span className="text-accent">Inteligente</span> en la Nube
          </h1>
          <p className="mt-4 max-w-lg text-zinc-400">
            Los usuarios crean tickets. La IA los clasifica, responde las preguntas
            fáciles sola y escala lo urgente automáticamente. Todo gratis y en la nube.
          </p>
          <div className="mt-8 flex gap-3">
            <Link
              href="/register"
              className="rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-surface hover:bg-accent-hover"
            >
              Crear una cuenta
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-surface-border px-5 py-3 text-sm font-medium text-zinc-200 hover:bg-surface-raised"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>
        <Card className="bg-surface-raised">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Flujo de un ticket urgente</p>
          <ol className="mt-3 space-y-2 text-sm text-zinc-300">
            <li>1. El usuario describe el problema</li>
            <li>2. Gemini lo clasifica y detecta que es crítico</li>
            <li>3. Se guarda en MongoDB Atlas</li>
            <li>4. n8n envía el email y crea la tarjeta en Trello</li>
            <li>5. El agente lo ve en su dashboard al instante</li>
          </ol>
        </Card>
      </section>

      <section>
        <h2 className="mb-6 text-xl font-semibold text-zinc-50">¿Qué incluye?</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title}>
              <f.icon className="h-5 w-5 text-accent" />
              <h3 className="mt-3 font-medium text-zinc-50">{f.title}</h3>
              <p className="mt-1 text-sm text-zinc-400">{f.description}</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
