"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { BookMarked, CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [state, setState] = useState<"loading" | "valid" | "invalid" | "accepting" | "success" | "error">("loading");
  const [invite, setInvite] = useState<{ email: string; orgName: string; role: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function validateToken() {
      try {
        const res = await fetch(`/api/invites/${token}`);
        if (res.ok) {
          const data = await res.json();
          setInvite(data);
          setState("valid");
        } else {
          const data = await res.json();
          setErrorMsg(data.error ?? "Invalid or expired invite link.");
          setState("invalid");
        }
      } catch {
        setErrorMsg("Something went wrong. Please try again.");
        setState("invalid");
      }
    }
    validateToken();
  }, [token]);

  useEffect(() => {
    if (status === "authenticated" && state === "valid" && invite) {
      if (session.user?.email !== invite.email) {
        setErrorMsg(`This invite was sent to ${invite.email}. Please sign in with that email.`);
        setState("error");
        return;
      }
      acceptInvite();
    }
  }, [status, state, invite, session]);

  async function acceptInvite() {
    setState("accepting");
    try {
      const res = await fetch(`/api/invites/${token}/accept`, { method: "POST" });
      if (res.ok) {
        setState("success");
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 2000);
      } else {
        const data = await res.json();
        setErrorMsg(data.error ?? "Failed to accept invite.");
        setState("error");
      }
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
      setState("error");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "hsl(220,20%,98%)" }}>
      <div className="w-full max-w-md">

        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "hsl(243,75%,59%)" }}>
            <BookMarked className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-lg text-slate-900">Knowdesk</span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">

          {(state === "loading" || state === "accepting") && (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <div className="text-sm text-slate-500">
                {state === "loading" ? "Validating your invite..." : "Joining organization..."}
              </div>
            </div>
          )}

          {state === "valid" && invite && status === "unauthenticated" && (
            <>
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-5">
                <BookMarked className="w-7 h-7 text-indigo-600" />
              </div>
              <h1 className="text-xl font-semibold text-slate-900 mb-2">You've been invited</h1>
              <p className="text-sm text-slate-500 mb-1">
                Join <strong className="text-slate-800">{invite.orgName}</strong> on Knowdesk
              </p>
              <p className="text-sm text-slate-500 mb-6">
                as <span className="text-indigo-600 font-medium">{invite.role}</span>
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 mb-6 text-sm text-slate-600">
                This invite was sent to <strong>{invite.email}</strong>.<br />
                Please sign in with that Google account.
              </div>
              <button
                onClick={() => signIn("google", { callbackUrl: `/invite/${token}` })}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
            </>
          )}

          {state === "success" && (
            <>
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="w-7 h-7 text-emerald-600" />
              </div>
              <h1 className="text-xl font-semibold text-slate-900 mb-2">You're in!</h1>
              <p className="text-sm text-slate-500">Redirecting to your dashboard...</p>
            </>
          )}

          {(state === "invalid" || state === "error") && (
            <>
              <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
                <XCircle className="w-7 h-7 text-red-500" />
              </div>
              <h1 className="text-xl font-semibold text-slate-900 mb-2">Invite invalid</h1>
              <p className="text-sm text-slate-500 mb-6">{errorMsg}</p>
              <a href="/login" className="text-sm text-indigo-600 hover:underline">Back to login</a>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
