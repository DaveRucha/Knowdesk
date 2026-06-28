import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  MessageCircle,
  BarChart,
} from "lucide-react";

import { authOptions } from "@/lib/auth";
import { SignOutButton } from "@/components/sign-out-button";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/sops", label: "SOPs", icon: BookOpen },
  { href: "/ask", label: "Ask a Question", icon: MessageCircle },
  { href: "/analytics", label: "Analytics", icon: BarChart },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (!session.user.organizationId) {
    redirect("/register");
  }

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-64 flex-col border-r bg-card px-4 py-6">
        <div className="mb-8">
          <h1 className="text-lg font-bold">Knowdesk</h1>
          <p className="text-xs text-muted-foreground">Knowledge Base</p>
        </div>

        <nav className="flex-1 space-y-1">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto border-t pt-4">
          <SignOutButton />
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
