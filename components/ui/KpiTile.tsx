import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

export function KpiTile({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <Card className="p-4">
      <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
      <p className={cn("mt-1.5 text-2xl font-semibold", accent ? "text-accent" : "text-zinc-50")}>
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-zinc-500">{hint}</p> : null}
    </Card>
  );
}
