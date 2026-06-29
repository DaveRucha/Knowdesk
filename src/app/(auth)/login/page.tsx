"use client";

import { useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { BookMarked } from "lucide-react";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      if (session?.user.organizationId) {
        router.push("/dashboard");
      } else {
        router.push("/register");
      }
    }
  }, [status, session, router]);

  if (status === "loading") return null;

  return (
    <div className="min-h-screen flex" style={{ background: "hsl(220,20%,98%)" }}>

      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12" style={{ background: "hsl(222,47%,11%)" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "hsl(243,75%,59%)" }}>
            <BookMarked className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-semibold text-lg">Knowdesk</span>
        </div>

        <div>
          <h1 className="text-4xl font-semibold text-white leading-tight mb-4">
            Your company's<br />knowledge, instantly<br />answered.
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
            Upload your documents and SOPs. Let employees ask questions in plain English and get cited, step-by-step answers powered by AI.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { stat: "< 2s", label: "Answer time" },
            { stat: "91%", label: "Answer rate" },
            { stat: "Zero", label: "Training needed" },
          ].map(({ stat, label }) => (
            <div key={label} className="rounded-xl p-4" style={{ background: "hsl(222,40%,16%)" }}>
              <div className="text-2xl font-semibold mb-1" style={{ color: "hsl(243,75%,75%)" }}>{stat}</div>
              <div className="text-xs text-slate-400">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — sign in */}
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "hsl(243,75%,59%)" }}>
              <BookMarked className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-slate-900">Knowdesk</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-slate-900 mb-1">Welcome back</h2>
            <p className="text-sm text-slate-500">Sign in to access your knowledge base</p>
          </div>

          <button
            onClick={() => signIn("google", { callbackUrl: "/register" })}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <p className="text-center text-xs text-slate-400 mt-6">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>

    </div>
  );
}
