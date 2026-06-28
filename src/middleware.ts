export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/documents/:path*",
    "/sops/:path*",
    "/ask/:path*",
    "/analytics/:path*",
  ],
};