import Link from "next/link";
import { Headset, LayoutDashboard, LibraryBig, Ticket, Users } from "lucide-react";
import type { Role } from "@/lib/models/types";
import { SignOutButton } from "@/components/SignOutButton";

interface NavProps {
  user: { name?: string | null; email?: string | null; role: Role } | null;
}

const linksByRole: Record<Role, Array<{ href: string; label: string; icon: React.ElementType }>> = {
  user: [{ href: "/tickets", label: "Mis tickets", icon: Ticket }],
  agent: [
    { href: "/agent", label: "Panel de agente", icon: Users },
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  ],
  admin: [
    { href: "/agent", label: "Panel de agente", icon: Users },
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/kb", label: "Base de conocimiento", icon: LibraryBig },
  ],
};

export function Nav({ user }: NavProps) {
  const links = user ? linksByRole[user.role] : [];

  return (
    <header className="border-b border-surface-border bg-surface/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href={user ? "/tickets" : "/"} className="flex items-center gap-2 font-semibold text-accent">
          <Headset className="h-5 w-5" />
          Help Desk Inteligente
        </Link>

        {user ? (
          <nav className="flex items-center gap-1">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-zinc-300 hover:bg-surface-raised hover:text-zinc-50"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
            <div className="ml-2 flex items-center gap-2 border-l border-surface-border pl-3">
              <span className="hidden text-sm text-zinc-400 sm:inline">
                {user.name ?? user.email}
              </span>
              <SignOutButton />
            </div>
          </nav>
        ) : (
          <nav className="flex items-center gap-2">
            <Link href="/login" className="rounded-lg px-3 py-1.5 text-sm text-zinc-300 hover:text-zinc-50">
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="rounded-xl bg-accent px-3.5 py-1.5 text-sm font-semibold text-surface hover:bg-accent-hover"
            >
              Crear cuenta
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
