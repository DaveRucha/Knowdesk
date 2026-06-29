import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { User, Mail, Shield, Building2, Calendar, Users } from "lucide-react";
import { SignOutButton } from "@/components/sign-out-button";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!session.user.organizationId) redirect("/register");

  const { userId, organizationId, role } = session.user;

  const [user, org, memberCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, image: true, createdAt: true, role: true },
    }),
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: { name: true, slug: true, createdAt: true },
    }),
    prisma.user.count({ where: { organizationId } }),
  ]);

  if (!user || !org) redirect("/login");

  const initials = user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
  const isAdmin = role === "ADMIN";

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-white border-b border-slate-200 px-8 py-4">
        <h1 className="text-lg font-semibold text-slate-900">Profile</h1>
        <p className="text-sm text-slate-500">Your account information and settings</p>
      </div>

      <div className="flex-1 p-8 max-w-2xl mx-auto w-full space-y-6">

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-5">
            {user.image ? (
              <img src={user.image} alt={user.name} className="w-16 h-16 rounded-full border-2 border-indigo-100" />
            ) : (
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-semibold text-white flex-shrink-0" style={{ background: "hsl(243,75%,59%)" }}>
                {initials}
              </div>
            )}
            <div>
              <div className="text-xl font-semibold text-slate-900">{user.name}</div>
              <div className="text-sm text-slate-500">{user.email}</div>
              <div className="mt-2">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${isAdmin ? "bg-indigo-50 text-indigo-700 border border-indigo-200" : "bg-slate-100 text-slate-600 border border-slate-200"}`}>
                  {isAdmin ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                  {isAdmin ? "Admin" : "Employee"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <div className="text-sm font-semibold text-slate-900">Account details</div>
          </div>
          <div className="divide-y divide-slate-50">
            <div className="flex items-center gap-4 px-6 py-4">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-slate-500" />
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-0.5">Full name</div>
                <div className="text-sm font-medium text-slate-800">{user.name}</div>
              </div>
            </div>
            <div className="flex items-center gap-4 px-6 py-4">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4 text-slate-500" />
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-0.5">Email address</div>
                <div className="text-sm font-medium text-slate-800">{user.email}</div>
              </div>
            </div>
            <div className="flex items-center gap-4 px-6 py-4">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                <Shield className="w-4 h-4 text-slate-500" />
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-0.5">Role</div>
                <div className="text-sm font-medium text-slate-800">{isAdmin ? "Admin" : "Employee"}</div>
              </div>
            </div>
            <div className="flex items-center gap-4 px-6 py-4">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4 h-4 text-slate-500" />
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-0.5">Member since</div>
                <div className="text-sm font-medium text-slate-800">
                  {new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <div className="text-sm font-semibold text-slate-900">Organization</div>
          </div>
          <div className="divide-y divide-slate-50">
            <div className="flex items-center gap-4 px-6 py-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-4 h-4 text-indigo-500" />
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-0.5">Organization name</div>
                <div className="text-sm font-medium text-slate-800">{org.name}</div>
              </div>
            </div>
            <div className="flex items-center gap-4 px-6 py-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 text-indigo-500" />
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-0.5">Team members</div>
                <div className="text-sm font-medium text-slate-800">{memberCount} {memberCount === 1 ? "member" : "members"}</div>
              </div>
            </div>
            <div className="flex items-center gap-4 px-6 py-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4 h-4 text-indigo-500" />
              </div>
              <div>
                <div className="text-xs text-slate-400 mb-0.5">Organization created</div>
                <div className="text-sm font-medium text-slate-800">
                  {new Date(org.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="text-sm font-semibold text-slate-900 mb-1">Sign out</div>
          <div className="text-xs text-slate-500 mb-4">You will be redirected to the login page</div>
          <SignOutButton variant="button" />
        </div>

      </div>
    </div>
  );
}
