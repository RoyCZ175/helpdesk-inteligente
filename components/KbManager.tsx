"use client";

import { useState, type FormEvent } from "react";
import { Trash2 } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Input, Label, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export interface KbArticleSummary {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
}

export function KbManager({ initialArticles }: { initialArticles: KbArticleSummary[] }) {
  const [articles, setArticles] = useState(initialArticles);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch("/api/kb", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        content,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      }),
    });

    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      setError(data.error ?? "No se pudo guardar el artículo");
      return;
    }

    setArticles((prev) => [data.article, ...prev]);
    setTitle("");
    setContent("");
    setTags("");
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/kb/${id}`, { method: "DELETE" });
    if (res.ok) {
      setArticles((prev) => prev.filter((a) => a.id !== id));
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader
          title="Nuevo artículo"
          description="Gemini responderá tickets similares citando este contenido"
        />
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="kb-title">Título</Label>
            <Input id="kb-title" required value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="kb-content">Contenido</Label>
            <Textarea
              id="kb-content"
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Pasos, instrucciones o política que resuelve la duda"
            />
          </div>
          <div>
            <Label htmlFor="kb-tags">Tags (separados por coma)</Label>
            <Input id="kb-tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="vpn, red, acceso" />
          </div>
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <Button type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Guardar artículo"}
          </Button>
        </form>
      </Card>

      <div>
        <CardHeader title="Artículos" description={`${articles.length} en la base de conocimiento`} />
        <div className="space-y-3">
          {articles.map((a) => (
            <Card key={a.id}>
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-medium text-zinc-50">{a.title}</h3>
                <button
                  onClick={() => handleDelete(a.id)}
                  className="text-zinc-500 hover:text-red-400"
                  aria-label="Eliminar artículo"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-1.5 line-clamp-3 text-sm text-zinc-400">{a.content}</p>
              {a.tags.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {a.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-surface-raised px-2 py-0.5 text-xs text-zinc-400">
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </Card>
          ))}
          {articles.length === 0 ? (
            <p className="text-sm text-zinc-500">Todavía no hay artículos.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
