"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

interface Props {
  variant?: "icon" | "button";
}

export function SignOutButton({ variant = "icon" }: Props) {
  if (variant === "button") {
    return (
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        Sign out
      </button>
    );
  }

  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors"
      style={{ color: "hsl(215,25%,45%)" }}
      title="Sign out"
    >
      <LogOut className="w-4 h-4" />
    </button>
  );
}
