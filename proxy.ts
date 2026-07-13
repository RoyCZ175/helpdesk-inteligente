import { NextResponse } from "next/server";
import { auth } from "@/lib/auth-edge";
import type { Role } from "@/lib/models/types";

const roleRoutes: Record<string, Role[]> = {
  "/dashboard": ["agent", "admin"],
  "/agent": ["agent", "admin"],
  "/admin": ["admin"],
};

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const protectedPrefix = Object.keys(roleRoutes).find((prefix) =>
    pathname.startsWith(prefix),
  );
  const requiresLogin = Boolean(protectedPrefix) || pathname.startsWith("/tickets");

  if (!session?.user && requiresLogin) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (protectedPrefix && session?.user) {
    const allowedRoles = roleRoutes[protectedPrefix];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.redirect(new URL("/tickets", req.nextUrl.origin));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/tickets/:path*", "/agent/:path*", "/admin/:path*", "/dashboard/:path*"],
};
