"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { BookMarked, Loader2, Building2, ArrowRight, Mail } from "lucide-react";

export default function RegisterPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const [mode, setMode] = useState<"choice" | "create">("choice");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (status === "loading") return null;
  if (status === "unauthenticated") { router.push("/login"); return null; }
  if (status === "authenticated" && session?.user?.organizationId) {
    router.push("/dashboard"); return null;
  }

  function handleNameChange(value: string) {
    setName(value);
    setSlug(value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug }),
      });
      if (res.ok) {
        await update();
        router.push("/dashboard");
      } else if (res.status === 400) {
        setError("This organization name is taken, please try another");
      }
    } finally {
      setIsLoading(false);
    }
  }

  const userName = session?.user?.name?.split(" ")[0] ?? "there";
  const userEmail = session?.user?.email ?? "";

  return (
    <div className="min-h-screen flex" style={{ background: "hsl(220,20%,98%)" }}>

      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12" style={{ background: "hsl(222,47%,11%)" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "hsl(243,75%,59%)" }}>
            <BookMarked className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-semibold text-lg">Knowdesk</span>
        </div>
        <div>
          <h1 className="text-4xl font-semibold text-white leading-tight mb-4">
            {mode === "create" ? "Set up your\nknowledge base\nin minutes." : "Welcome to\nKnowdesk."}
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
            {mode === "create"
              ? "Create your organization, upload your first document, and start answering employee questions automatically."
              : "Your company's knowledge, instantly answered by AI."}
          </p>
        </div>
        {mode === "create" && (
          <div className="space-y-3">
            {[
              { step: "1", text: "Create your organization" },
              { step: "2", text: "Upload company documents" },
              { step: "3", text: "Employees ask, AI answers" },
            ].map(({ step, text }) => (
              <div key={step} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0" style={{ background: "hsl(243,75%,59%)" }}>
                  {step}
                </div>
                <span className="text-slate-300 text-sm">{text}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <div className="w-full max-w-sm">

          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "hsl(243,75%,59%)" }}>
              <BookMarked className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-slate-900">Knowdesk</span>
          </div>

          {/* Choice screen */}
          {mode === "choice" && (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-slate-900 mb-1">Hey {userName}! 👋</h2>
                <p className="text-sm text-slate-500">Signed in as <span className="text-slate-700 font-medium">{userEmail}</span></p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => setMode("create")}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50 transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 group-hover:bg-indigo-100 flex items-center justify-center flex-shrink-0 transition-colors">
                    <Building2 className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Create a new workspace</div>
                    <div className="text-xs text-slate-500">Set up Knowdesk for your company</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 ml-auto" />
                </button>

                <div className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-slate-200 bg-slate-50 text-left opacity-75">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-600">Join via invite</div>
                    <div className="text-xs text-slate-400">Ask your admin to send an invite to {userEmail}</div>
                  </div>
                </div>
              </div>

              <p className="text-center text-xs text-slate-400 mt-6">
                Wrong account?{" "}
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="text-indigo-600 hover:underline"
                >
                  Sign out
                </button>
              </p>
            </>
          )}

          {/* Create org form */}
          {mode === "create" && (
            <>
              <div className="mb-8">
                <button
                  onClick={() => setMode("choice")}
                  className="text-xs text-slate-400 hover:text-slate-600 mb-4 flex items-center gap-1"
                >
                  ← Back
                </button>
                <h2 className="text-2xl font-semibold text-slate-900 mb-1">Create your workspace</h2>
                <p className="text-sm text-slate-500">You'll be set as the Admin</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Organization name</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <Building2 className="w-4 h-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="Acme Inc."
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  </div>
                  {slug && (
                    <p className="text-xs text-slate-400 mt-1.5 pl-1">
                      Workspace URL: <span className="text-indigo-500 font-medium">knowdesk.app/{slug}</span>
                    </p>
                  )}
                </div>

                {error && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !name.trim()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: "hsl(243,75%,59%)" }}
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><ArrowRight className="w-4 h-4" />Create Workspace</>}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
