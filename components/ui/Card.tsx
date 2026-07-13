import { cn } from "@/lib/utils";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-surface-border bg-surface-soft p-5 shadow-sm shadow-black/20",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-base font-semibold text-zinc-50">{title}</h2>
        {description ? <p className="mt-0.5 text-sm text-zinc-400">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
