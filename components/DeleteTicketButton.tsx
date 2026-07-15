"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function DeleteTicketButton({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      "¿Borrar este ticket? Esta acción no se puede deshacer.",
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }
      router.refresh();
    } catch (error) {
      console.error("Error borrando ticket:", error);
      window.alert("No se pudo borrar el ticket. Revisa la consola.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Button
      variant="danger"
      size="sm"
      onClick={handleDelete}
      disabled={isDeleting}
      type="button"
    >
      {isDeleting ? "Borrando…" : "Borrar"}
    </Button>
  );
}
