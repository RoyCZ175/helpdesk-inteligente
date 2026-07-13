import type { Role } from "@/lib/models/types";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    role: Role;
  }

  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
  }
}

// "next-auth/jwt" re-exports its JWT type from "@auth/core/jwt" (`export * from
// "@auth/core/jwt"`), so declaration merging only takes effect when the
// augmentation targets that original module directly.
declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: Role;
  }
}
