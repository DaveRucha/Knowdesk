import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { withOrgContext } from "@/lib/prisma";
import { FileText, BookOpen, MessageCircle, CheckCircle, AlertTriangle, Calendar } from "lucide-react";
import { InviteModal } from "@/components/invite-modal";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const organizationId = session?.user.organizationId;
  const userId = session?.user.userId;
  if (!organizationId) redirect("/login");

  const isAdmin = session?.user.role === "ADMIN";
  const firstName = session?.user.name?.split(" ")[0] ?? "there";

  if (isAdmin) {
    const [
      organization,
      documentCount,
      sopCount,
      queryCount,
      answeredCount,
      gapCount,
    ] = await withOrgContext(organizationId, (tx) =>
      Promise.all([
        tx.organization.findUnique({ where: { id: organizationId } }),
        tx.document.count({ where: { organizationId } }),
        tx.sOP.count({ where: { organizationId } }),
        tx.query.count({ where: { organizationId } }),
        tx.query.count({ where: { organizationId, wasAnswered: true } }),
        tx.query.count({ where: { organizationId, wasAnswered: false } }),
      ])
    );

    const answerRate = queryCount === 0 ? "N/A" : `${Math.round((answeredCount / queryCount) * 100)}%`;

    return (
      <div className="flex flex-col min-h-screen">
        <div className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Good morning, {firstName} 👋</h1>
            <p className="text-sm text-slate-500">{organization?.name} · knowledge base overview</p>
          </div>
          <div className="flex items-center gap-3">
            <InviteModal />
            <a href="/documents" className="text-sm font-medium px-4 py-2 rounded-lg border border-indigo-200 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors">
              + Upload doc
            </a>
            <a href="/sops/new" className="text-sm font-medium px-4 py-2 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">
              Generate SOP
            </a>
          </div>
        </div>

        <div className="flex-1 p-8 space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="bg-white rounded-xl border border-slate-200 p-5 relative overflow-hidden" style={{borderTop: "3px solid #6366f1"}}>
              <div className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                <FileText className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-xs font-medium text-slate-500 mb-2">Total Documents</div>
              <div className="text-3xl font-semibold text-slate-900">{documentCount}</div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 relative overflow-hidden" style={{borderTop: "3px solid #7c3aed"}}>
              <div className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-violet-600" />
              </div>
              <div className="text-xs font-medium text-slate-500 mb-2">Total SOPs</div>
              <div className="text-3xl font-semibold text-slate-900">{sopCount}</div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 relative overflow-hidden" style={{borderTop: "3px solid #818cf8"}}>
              <div className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-xs font-medium text-slate-500 mb-2">Total Queries</div>
              <div className="text-3xl font-semibold text-slate-900">{queryCount}</div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 relative overflow-hidden" style={{borderTop: "3px solid #10b981"}}>
              <div className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xs font-medium text-slate-500 mb-2">Answer Rate</div>
              <div className="text-3xl font-semibold text-slate-900">{answerRate}</div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-5 relative overflow-hidden" style={{borderTop: "3px solid #f87171"}}>
              <div className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-red-500" />
              </div>
              <div className="text-xs font-medium text-slate-500 mb-2">Knowledge Gaps</div>
              <div className="text-3xl font-semibold text-slate-900">{gapCount}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <a href="/ask" className="bg-white rounded-xl border border-slate-200 p-6 hover:border-indigo-300 hover:shadow-sm transition-all">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center mb-4">
                <MessageCircle className="w-5 h-5 text-indigo-600" />
              </div>
              <div className="text-sm font-semibold text-slate-900 mb-1">Ask a question</div>
              <div className="text-xs text-slate-500">Get instant answers from your knowledge base</div>
            </a>
            <a href="/documents" className="bg-white rounded-xl border border-slate-200 p-6 hover:border-indigo-300 hover:shadow-sm transition-all">
              <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center mb-4">
                <FileText className="w-5 h-5 text-violet-600" />
              </div>
              <div className="text-sm font-semibold text-slate-900 mb-1">Upload documents</div>
              <div className="text-xs text-slate-500">Add PDFs to expand your knowledge base</div>
            </a>
            <a href="/sops/new" className="bg-white rounded-xl border border-slate-200 p-6 hover:border-indigo-300 hover:shadow-sm transition-all">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center mb-4">
                <BookOpen className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-sm font-semibold text-slate-900 mb-1">Generate SOP</div>
              <div className="text-xs text-slate-500">Create standard operating procedures with AI</div>
            </a>
          </div>

          {queryCount > 0 && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-indigo-900">
                    {answerRate} of questions answered from your knowledge base
                  </div>
                  <div className="text-xs text-indigo-600">
                    {gapCount} unanswered {gapCount === 1 ? "question" : "questions"} logged as gaps
                    {gapCount > 0 && " · consider generating SOPs to fill them"}
                  </div>
                </div>
              </div>
              {gapCount > 0 && (
                <a href="/gaps" className="text-xs font-medium text-indigo-600 hover:text-indigo-800 whitespace-nowrap">
                  View gaps →
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Employee dashboard
  const [
    organization,
    sopCount,
    myQueryCount,
    myAnsweredCount,
    myGapCount,
    recentSops,
  ] = await withOrgContext(organizationId, (tx) =>
    Promise.all([
      tx.organization.findUnique({ where: { id: organizationId } }),
      tx.sOP.count({ where: { organizationId } }),
      tx.query.count({ where: { organizationId, askedById: userId! } }),
      tx.query.count({ where: { organizationId, askedById: userId!, wasAnswered: true } }),
      tx.query.count({ where: { organizationId, askedById: userId!, wasAnswered: false } }),
      tx.sOP.findMany({
        where: { organizationId },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: { id: true, title: true, createdAt: true },
      }),
    ])
  );

  const myAnswerRate = myQueryCount === 0 ? "N/A" : `${Math.round((myAnsweredCount / myQueryCount) * 100)}%`;

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-white border-b border-slate-200 px-8 py-4">
        <h1 className="text-lg font-semibold text-slate-900">Good morning, {firstName} 👋</h1>
        <p className="text-sm text-slate-500">{organization?.name} · knowledge base overview</p>
      </div>

      <div className="flex-1 p-8 space-y-6">
        {/* Employee stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white rounded-xl border border-slate-200 p-5 relative overflow-hidden" style={{borderTop: "3px solid #818cf8"}}>
            <div className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-xs font-medium text-slate-500 mb-2">Your Questions</div>
            <div className="text-3xl font-semibold text-slate-900">{myQueryCount}</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5 relative overflow-hidden" style={{borderTop: "3px solid #10b981"}}>
            <div className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xs font-medium text-slate-500 mb-2">Answer Rate</div>
            <div className="text-3xl font-semibold text-slate-900">{myAnswerRate}</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5 relative overflow-hidden" style={{borderTop: "3px solid #7c3aed"}}>
            <div className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-violet-600" />
            </div>
            <div className="text-xs font-medium text-slate-500 mb-2">Available SOPs</div>
            <div className="text-3xl font-semibold text-slate-900">{sopCount}</div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <a href="/ask" className="bg-white rounded-xl border border-slate-200 p-6 hover:border-indigo-300 hover:shadow-sm transition-all">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center mb-4">
              <MessageCircle className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="text-sm font-semibold text-slate-900 mb-1">Ask a question</div>
            <div className="text-xs text-slate-500">Get instant answers from your knowledge base</div>
          </a>
          <a href="/sops" className="bg-white rounded-xl border border-slate-200 p-6 hover:border-indigo-300 hover:shadow-sm transition-all">
            <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center mb-4">
              <BookOpen className="w-5 h-5 text-violet-600" />
            </div>
            <div className="text-sm font-semibold text-slate-900 mb-1">Browse SOPs</div>
            <div className="text-xs text-slate-500">View standard operating procedures for your org</div>
          </a>
        </div>

        {/* Recent SOPs */}
        {recentSops.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-900">Recent SOPs</div>
              <Link href="/sops" className="text-xs font-medium text-indigo-600 hover:text-indigo-800">
                View all →
              </Link>
            </div>
            <div className="divide-y divide-slate-50">
              {recentSops.map((sop) => (
                <div key={sop.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-violet-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-800">{sop.title}</div>
                      <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        {new Date(sop.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/sops/${sop.id}`}
                    className="text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    View SOP
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}