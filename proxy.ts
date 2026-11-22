import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const login = () => NextResponse.redirect(new URL("/login", request.url));
  const authUrl = process.env.NEXT_PUBLIC_BETTER_AUTH_URL;
  const cookie = request.headers.get("cookie");

  if (
    !authUrl ||
    !cookie ||
    !(request.cookies.get("better-auth.session_token")?.value ||
      request.cookies.get("__Secure-better-auth.session_token")?.value)
  ) {
    return login();
  }

  try {
    const response = await fetch(`${authUrl.replace(/\/+$/, "")}/get-session`, {
      headers: { cookie },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return login();

    const session = (await response.json()) as {
      user?: { id?: unknown; role?: unknown; isBlocked?: unknown };
    } | null;
    const user = session?.user;
    if (typeof user?.id !== "string" || user.isBlocked === true) return login();

    const { pathname } = request.nextUrl;
    const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
    if (isAdminRoute && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
  } catch {
    return login();
  }
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*"],
};
