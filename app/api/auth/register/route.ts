import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getCollection, COLLECTIONS } from "@/lib/db";
import type { UserDoc } from "@/lib/models/types";
import { registerSchema } from "@/lib/models/schemas";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 },
    );
  }

  const { name, email, password } = parsed.data;
  const users = await getCollection<UserDoc>(COLLECTIONS.users);

  const existing = await users.findOne({ email });
  if (existing) {
    return NextResponse.json({ error: "Ese email ya está registrado" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    await users.insertOne({
      name,
      email,
      passwordHash,
      role: "user",
      createdAt: new Date(),
    });
  } catch (error) {
    const isDuplicateKey =
      typeof error === "object" && error !== null && "code" in error && error.code === 11000;
    if (isDuplicateKey) {
      return NextResponse.json({ error: "Ese email ya está registrado" }, { status: 409 });
    }
    throw error;
  }

  return NextResponse.json({ ok: true });
}
