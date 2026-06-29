"use client";

import { useState } from "react";
import { UserPlus, X, Mail, Shield, User, Loader2, CheckCircle } from "lucide-react";

export function InviteModal() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"EMPLOYEE" | "ADMIN">("EMPLOYEE");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error ?? "Failed to send invite.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setOpen(false);
    setTimeout(() => {
      setEmail("");
      setRole("EMPLOYEE");
      setSuccess(false);
      setError("");
    }, 300);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-indigo-200 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
      >
        <UserPlus className="w-4 h-4" />
        Invite member
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(15,23,42,0.5)" }}
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-md">

            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <UserPlus className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Invite a team member</div>
                  <div className="text-xs text-slate-400">They'll receive an email with a sign-in link</div>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6">
              {success ? (
                <div className="flex flex-col items-center text-center py-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="text-sm font-semibold text-slate-900 mb-1">Invite sent!</div>
                  <div className="text-xs text-slate-500 mb-6">
                    An invite email has been sent to <strong>{email}</strong>.<br />
                    The link expires in 48 hours.
                  </div>
                  <div className="flex gap-3 w-full">
                    <button
                      onClick={() => { setSuccess(false); setEmail(""); }}
                      className="flex-1 px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      Invite another
                    </button>
                    <button
                      onClick={handleClose}
                      className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleInvite} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Email address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="colleague@company.com"
                        required
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Role</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setRole("EMPLOYEE")}
                        className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${role === "EMPLOYEE" ? "border-indigo-500 bg-indigo-50" : "border-slate-200 bg-white hover:border-slate-300"}`}
                      >
                        <User className={`w-4 h-4 flex-shrink-0 ${role === "EMPLOYEE" ? "text-indigo-600" : "text-slate-400"}`} />
                        <div>
                          <div className={`text-xs font-semibold ${role === "EMPLOYEE" ? "text-indigo-700" : "text-slate-700"}`}>Employee</div>
                          <div className="text-xs text-slate-400">Ask questions</div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole("ADMIN")}
                        className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${role === "ADMIN" ? "border-indigo-500 bg-indigo-50" : "border-slate-200 bg-white hover:border-slate-300"}`}
                      >
                        <Shield className={`w-4 h-4 flex-shrink-0 ${role === "ADMIN" ? "text-indigo-600" : "text-slate-400"}`} />
                        <div>
                          <div className={`text-xs font-semibold ${role === "ADMIN" ? "text-indigo-700" : "text-slate-700"}`}>Admin</div>
                          <div className="text-xs text-slate-400">Full access</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3 pt-1">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !email.trim()}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send invite"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
