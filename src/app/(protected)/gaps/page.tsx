"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { X, AlertTriangle, BookOpen, CheckCircle, Clock } from "lucide-react";

interface GapItem {
  question: string;
  count: number;
  latest_asked: string;
  avg_confidence: number;
  is_resolved: boolean;
}

export default function GapsPage() {
  const [gaps, setGaps] = useState<GapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchGaps = useCallback(async () => {
    try {
      const res = await fetch("/api/gaps");
      if (res.status === 403) {
        setError("You don't have permission to view this page.");
      } else if (!res.ok) {
        setError("Failed to load knowledge gaps.");
      } else {
        const data = await res.json();
        setGaps(data);
      }
    } catch {
      setError("Failed to load knowledge gaps.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGaps();
  }, [fetchGaps]);

  async function handleDismiss(question: string) {
    try {
      const res = await fetch("/api/gaps", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      if (res.ok) {
        setGaps((prev) => prev.filter((gap) => gap.question !== question));
      } else {
        setError("Failed to dismiss question.");
      }
    } catch {
      setError("Failed to dismiss question.");
    }
  }

  const openGaps = gaps.filter(g => !g.is_resolved);
  const resolvedGaps = gaps.filter(g => g.is_resolved);

  return (
    <div className="flex flex-col min-h-screen">

      {/* Topbar */}
      <div className="bg-white border-b border-slate-200 px-8 py-4">
        <h1 className="text-lg font-semibold text-slate-900">Knowledge Gaps</h1>
        <p className="text-sm text-slate-500">Questions your team asked that couldn&apos;t be answered</p>
      </div>

      <div className="flex-1 p-8 space-y-6">

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-5" style={{borderTop: "3px solid #f87171"}}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Open gaps</div>
                    <div className="text-2xl font-semibold text-slate-900">{openGaps.length}</div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5" style={{borderTop: "3px solid #10b981"}}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Resolved</div>
                    <div className="text-2xl font-semibold text-slate-900">{resolvedGaps.length}</div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5" style={{borderTop: "3px solid #6366f1"}}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Total questions</div>
                    <div className="text-2xl font-semibold text-slate-900">{gaps.reduce((a, g) => a + g.count, 0)}</div>
                  </div>
                </div>
              </div>
            </div>

            {gaps.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center bg-white rounded-xl border border-slate-200">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center mb-3">
                  <CheckCircle className="w-6 h-6 text-emerald-500" />
                </div>
                <div className="text-sm font-semibold text-slate-700 mb-1">No gaps found</div>
                <div className="text-xs text-slate-400">Your knowledge base is covering all questions!</div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-900">Unanswered Questions</div>
                  <div className="text-xs text-slate-400">{openGaps.length} need attention</div>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-6 py-3">Question</th>
                      <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-6 py-3">Asked</th>
                      <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-6 py-3">Last seen</th>
                      <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-6 py-3">Confidence</th>
                      <th className="text-right text-xs font-medium text-slate-400 uppercase tracking-wider px-6 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {gaps.map((gap) => (
                      <tr key={gap.question} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-start gap-3">
                            <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                            </div>
                            <span className="text-sm text-slate-800">{gap.question}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                            {gap.count}×
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {new Date(gap.latest_asked).toLocaleDateString("en-US", {
                            month: "short", day: "numeric", year: "numeric"
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full max-w-16">
                              <div
                                className="h-full bg-amber-400 rounded-full"
                                style={{ width: `${Math.round(gap.avg_confidence * 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-500">{Math.round(gap.avg_confidence * 100)}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {gap.is_resolved ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600 border border-emerald-200">
                                <CheckCircle className="w-3 h-3" />
                                Resolved
                              </span>
                            ) : (
                              <>
                                <Link
                                  href={`/sops/new?topic=${encodeURIComponent(gap.question)}`}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors"
                                >
                                  <BookOpen className="w-3 h-3" />
                                  Create SOP
                                </Link>
                                <button
                                  onClick={() => handleDismiss(gap.question)}
                                  className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
