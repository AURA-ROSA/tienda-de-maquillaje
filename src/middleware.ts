import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE_NAME, verifyAdminToken } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Proteger exclusivamente las rutas del panel administrativo (/admin)
  if (pathname.startsWith("/admin")) {
    const sessionCookie = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const isValid = await verifyAdminToken(sessionCookie);

    // 1. Si está en /admin/login
    if (pathname === "/admin/login") {
      // Si ya tiene sesión activa, redirigir directo al panel
      if (isValid) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      return NextResponse.next();
    }

    // 2. Si intenta entrar a cualquier otra sección de /admin sin sesión
    if (!isValid) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
