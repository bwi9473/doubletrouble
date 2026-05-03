import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const requiresAdmin = ["/gebruikers", "/spelers"].some((path) =>
    request.nextUrl.pathname.startsWith(path),
  );

  if (requiresAdmin) {
    const role = request.cookies.get("demo-role")?.value;
    if (role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/gebruikers/:path*", "/spelers/:path*"],
};
