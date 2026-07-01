"use client";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Trash2, BookOpen, Calendar, FileText } from "lucide-react";

interface SopItem {
  id: string;
  title: string;
  createdAt: string;
}

export default function SopsPage() {
  const [sops, setSops] = useState<SopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const fetchSops = useCallback(async () => {
    try {
      const res = await fetch("/api/sops");
      if (res.ok) {
        const data = await res.json();
        setSops(data);
      } else {
        setError("Failed to load SOPs.");
      }
    } catch {
      setError("Failed to load SOPs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSops();
  }, [fetchSops]);

  async function handleDelete(id: string) {
    if (!window.confirm("Are you sure you want to delete this SOP?")) return;
    try {
      const res = await fetch(`/api/sops/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSops((prev) => prev.filter((sop) => sop.id !== id));
      } else {
        setError("Failed to delete SOP.");
      }
    } catch {
      setError("Failed to delete SOP.");
    }
  }

  return (
    <div className="flex flex-col min-h-screen">

      {/* Topbar */}
      <div className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">SOPs</h1>
          <p className="text-sm text-slate-500">Standard operating procedures for your organization</p>
        </div>
        {isAdmin && (
          <Link href="/sops/new" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">
            <Plus className="w-4 h-4" />
            Create New SOP
          </Link>
        )}
      </div>

      <div className="flex-1 p-8">

        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {!loading && sops.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center mb-4">
              <BookOpen className="w-7 h-7 text-violet-500" />
            </div>
            <div className="text-sm font-semibold text-slate-700 mb-1">No SOPs yet</div>
            <div className="text-xs text-slate-400 mb-6">Create your first SOP to document your processes</div>
            {isAdmin && (
              <Link href="/sops/new" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">
                <Plus className="w-4 h-4" />
                Create your first SOP
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sops.map((sop) => (
              <div key={sop.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:border-indigo-300 hover:shadow-sm transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-violet-600" />
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(sop.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="mb-4">
                  <div className="text-sm font-semibold text-slate-900 mb-1 line-clamp-2">{sop.title}</div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Calendar className="w-3 h-3" />
                    {new Date(sop.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                </div>

                <Link
                  href={`/sops/${sop.id}`}
                  className="flex items-center justify-center w-full px-3 py-2 rounded-lg text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                >
                  View SOP
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
