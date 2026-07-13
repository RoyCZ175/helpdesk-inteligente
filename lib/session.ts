import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import type { Role } from "@/lib/models/types";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function requireUser() {
  const session = await auth();
  if (!session?.user) {
    throw new ApiError("No autenticado", 401);
  }
  return session.user;
}

export async function requireRole(roles: Role[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    throw new ApiError("No autorizado", 403);
  }
  return user;
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error(error);
  return NextResponse.json({ error: "Error interno" }, { status: 500 });
}
