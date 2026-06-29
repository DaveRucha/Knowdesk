"use client";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors"
      style={{ color: "hsl(215,25%,45%)" }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.background = "hsl(222,40%,16%)";
        (e.currentTarget as HTMLElement).style.color = "hsl(0,84%,70%)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.background = "transparent";
        (e.currentTarget as HTMLElement).style.color = "hsl(215,25%,45%)";
      }}
      title="Sign out"
    >
      <LogOut className="w-4 h-4" />
    </button>
  );
}