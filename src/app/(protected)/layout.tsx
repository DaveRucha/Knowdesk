import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  MessageCircle,
  AlertCircle,
  BarChart,
  BookMarked,
  UserCircle,
} from "lucide-react";
import { authOptions } from "@/lib/auth";
import { SignOutButton } from "@/components/sign-out-button";

const ALL_NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, adminOnly: false },
  { href: "/ask", label: "Ask a Question", icon: MessageCircle, adminOnly: false },
  { href: "/documents", label: "Documents", icon: FileText, adminOnly: false },
  { href: "/sops", label: "SOPs", icon: BookOpen, adminOnly: false },
  { href: "/gaps", label: "Knowledge Gaps", icon: AlertCircle, adminOnly: true },
  { href: "/analytics", label: "Analytics", icon: BarChart, adminOnly: true },
  { href: "/profile", label: "Profile", icon: UserCircle, adminOnly: false },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!session.user.organizationId) redirect("/register");

  const isAdmin = session.user.role === "ADMIN";
  const navLinks = ALL_NAV_LINKS.filter(link => !link.adminOnly || isAdmin);
  const userName = session.user.name ?? "User";
  const userInitials = userName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="flex min-h-screen bg-[hsl(220,20%,98%)]">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col flex-shrink-0" style={{ background: "hsl(222,47%,11%)" }}>
        
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: "hsl(222,40%,16%)" }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "hsl(243,75%,59%)" }}>
            <BookMarked className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">Knowdesk</div>
            <div className="text-xs" style={{ color: "hsl(215,25%,45%)" }}>Knowledge Base</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <div className="text-xs font-medium uppercase tracking-wider px-3 pb-2" style={{ color: "hsl(215,25%,40%)" }}>
            Workspace
          </div>
          {navLinks.filter(l => !l.adminOnly).map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-slate-400 hover:text-slate-100 hover:bg-slate-800"
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          ))}

          {isAdmin && (
            <>
              <div className="text-xs font-medium uppercase tracking-wider px-3 pb-2 pt-4" style={{ color: "hsl(215,25%,40%)" }}>
                Admin
              </div>
              {navLinks.filter(l => l.adminOnly).map(({ href, label, icon: Icon }) => (
                <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {label}
                  </Link>
              ))}
            </>
          )}
        </nav>

        {/* User */}
        <div className="px-3 py-4 border-t" style={{ borderColor: "hsl(222,40%,16%)" }}>
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0" style={{ background: "hsl(243,75%,59%)" }}>
              {userInitials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-white truncate">{userName}</div>
              <div className="text-xs" style={{ color: "hsl(215,25%,45%)" }}>{isAdmin ? "Admin" : "Employee"}</div>
            </div>
            <SignOutButton />
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}