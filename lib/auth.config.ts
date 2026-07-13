import type { NextAuthConfig } from "next-auth";

// Config "edge-safe": sin providers que toquen la base de datos (bcrypt/mongodb
// no corren en el Edge Runtime). El middleware/proxy solo necesita leer la
// sesión (rol, id) para proteger rutas, no necesita poder autenticar.
// lib/auth.ts extiende esto agregando el provider de Credentials para el
// resto de la app (API routes, server components), que sí corren en Node.js.
export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.role = token.role;
        session.user.id = token.id as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
