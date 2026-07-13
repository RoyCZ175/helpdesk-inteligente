"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Sparkles } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Input, Label, Select, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { PriorityBadge, StatusBadge } from "@/components/ui/Badge";
import type { Priority, TicketStatus } from "@/lib/models/types";

interface SimilarMatch {
  ticketId: string;
  title: string;
  status: string;
  score: number;
}

interface CreatedTicketResult {
  id: string;
  status: TicketStatus;
  priority: Priority;
  ai: { priority: Priority; categoria: string; escalar: boolean } | null;
  aiAnswer: string | null;
}

export function TicketForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("media");
  const [similar, setSimilar] = useState<SimilarMatch[]>([]);
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreatedTicketResult | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const canCheck = title.trim().length >= 5 && description.trim().length >= 10;

    debounceRef.current = setTimeout(async () => {
      if (!canCheck) {
        setSimilar([]);
        return;
      }

      setChecking(true);
      try {
        const res = await fetch("/api/tickets/similar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, description }),
        });
        if (res.ok) {
          const data = await res.json();
          setSimilar(data.matches ?? []);
        }
      } finally {
        setChecking(false);
      }
    }, 700);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [title, description]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, priority }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "No se pudo crear el ticket");
        return;
      }

      setResult(data.ticket);
      setTitle("");
      setDescription("");
      setPriority("media");
      setSimilar([]);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader title="Crear ticket" description="Describe tu problema, la IA se encarga del resto" />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="title">Título</Label>
          <Input
            id="title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: No puedo acceder al sistema"
          />
        </div>

        <div>
          <Label htmlFor="description">Descripción</Label>
          <Textarea
            id="description"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Cuéntanos qué pasó, cuándo empezó y qué mensaje de error ves (si hay alguno)"
          />
        </div>

        <div className="max-w-[10rem]">
          <Label htmlFor="priority">Prioridad</Label>
          <Select
            id="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
          >
            <option value="baja">Baja</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
            <option value="critica">Crítica</option>
          </Select>
        </div>

        {checking ? <p className="text-xs text-zinc-500">Buscando tickets parecidos...</p> : null}

        {similar.length > 0 ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
            <p className="flex items-center gap-1.5 text-sm font-medium text-amber-400">
              <AlertTriangle className="h-4 w-4" />
              Ya existen tickets parecidos
            </p>
            <ul className="mt-2 space-y-1">
              {similar.map((s) => (
                <li key={s.ticketId} className="text-sm text-zinc-300">
                  {s.title}{" "}
                  <span className="text-xs text-zinc-500">
                    ({Math.round(s.score * 100)}% similar)
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-zinc-500">
              Puedes seguir y crear el tuyo de todas formas si no es lo mismo.
            </p>
          </div>
        ) : null}

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        <Button type="submit" disabled={submitting}>
          {submitting ? "Enviando..." : "Enviar ticket"}
        </Button>
      </form>

      {result ? (
        <div className="mt-5 rounded-xl border border-accent/30 bg-accent-muted p-4">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-accent">
            <Sparkles className="h-4 w-4" />
            ¡Ticket creado! <StatusBadge status={result.status} />
          </p>
          {result.ai ? (
            <p className="mt-2 text-sm text-zinc-300">
              La IA lo clasificó como <PriorityBadge priority={result.ai.priority} /> ·{" "}
              {result.ai.categoria}
              {result.ai.escalar ? " · escalado al equipo" : ""}
            </p>
          ) : null}
          {result.aiAnswer ? (
            <div className="mt-3 rounded-lg bg-surface p-3 text-sm text-zinc-200">
              <p className="mb-1 text-xs uppercase tracking-wide text-zinc-500">
                Respuesta automática
              </p>
              {result.aiAnswer}
            </div>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
