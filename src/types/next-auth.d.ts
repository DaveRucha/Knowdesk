import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      userId: string;
      role: "ADMIN" | "EMPLOYEE";
      organizationId: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: string;
    role: "ADMIN" | "EMPLOYEE";
    organizationId: string | null;
  }
}
