import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth.token?.role;

    const adminOnlyRoutes = ["/gaps", "/analytics"];
    const isAdminRoute = adminOnlyRoutes.some((route) =>
      pathname.startsWith(route)
    );

    if (isAdminRoute && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/documents/:path*",
    "/sops/:path*",
    "/ask/:path*",
    "/analytics/:path*",
    "/gaps/:path*",
  ],
};