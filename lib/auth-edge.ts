import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Instancia separada, solo para el proxy/middleware (Edge Runtime). No trae
// el provider de Credentials, así que nunca importa bcrypt ni lib/db.ts.
export const { auth } = NextAuth(authConfig);
