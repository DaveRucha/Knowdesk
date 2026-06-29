import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { BarChart2, MessageCircle, CheckCircle, FileText, BookOpen } from "lucide-react";
import { AnalyticsCharts } from "@/components/analytics-charts";

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!session.user.organizationId) redirect("/register");
  if (session.user.role !== "ADMIN") redirect("/dashboard");

  const { organizationId } = session.user;

  const [
    totalQueries,
    answeredQueries,
    documentCount,
    sopCount,
    topQuestions,
    recentQueries,
    dailyActivity,
  ] = await Promise.all([
    prisma.query.count({ where: { organizationId } }),
    prisma.query.count({ where: { organizationId, wasAnswered: true } }),
    prisma.document.count({ where: { organizationId } }),
    prisma.sOP.count({ where: { organizationId } }),
    prisma.$queryRaw<Array<{ question: string; count: bigint }>>(Prisma.sql`
      SELECT question, COUNT(*) as count
      FROM "Query"
      WHERE "organizationId" = ${organizationId}
      GROUP BY question
      ORDER BY count DESC
      LIMIT 5
    `),
    prisma.query.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { question: true, wasAnswered: true, confidence: true, createdAt: true },
    }),
    prisma.$queryRaw<Array<{ date: string; count: bigint; answered: bigint }>>(Prisma.sql`
      SELECT
        DATE("createdAt") as date,
        COUNT(*) as count,
        COUNT(*) FILTER (WHERE "wasAnswered" = true) as answered
      FROM "Query"
      WHERE "organizationId" = ${organizationId}
        AND "createdAt" >= NOW() - INTERVAL '7 days'
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `),
  ]);

  const answerRate = totalQueries === 0 ? 0 : Math.round((answeredQueries / totalQueries) * 100);
  const gapCount = totalQueries - answeredQueries;

  const dailyData = dailyActivity.map(d => ({
    date: new Date(d.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
    questions: Number(d.count),
    answered: Number(d.answered),
    gaps: Number(d.count) - Number(d.answered),
  }));

  const topQuestionsData = topQuestions.map(q => ({
    question: q.question.length > 40 ? q.question.slice(0, 40) + "..." : q.question,
    count: Number(q.count),
  }));

  const donutData = [
    { name: "Answered", value: answeredQueries, color: "#6366f1" },
    { name: "Unanswered", value: gapCount, color: "#fbbf24" },
  ];

  return (
    <div className="flex flex-col min-h-screen">

      {/* Topbar */}
      <div className="bg-white border-b border-slate-200 px-8 py-4">
        <h1 className="text-lg font-semibold text-slate-900">Analytics</h1>
        <p className="text-sm text-slate-500">Knowledge base usage insights</p>
      </div>

      <div className="flex-1 p-8 space-y-6">

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5" style={{borderTop: "3px solid #6366f1"}}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <div className="text-xs text-slate-500">Total questions</div>
                <div className="text-2xl font-semibold text-slate-900">{totalQueries}</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5" style={{borderTop: "3px solid #10b981"}}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <div className="text-xs text-slate-500">Answer rate</div>
                <div className="text-2xl font-semibold text-slate-900">{answerRate}%</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5" style={{borderTop: "3px solid #7c3aed"}}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
                <FileText className="w-4 h-4 text-violet-600" />
              </div>
              <div>
                <div className="text-xs text-slate-500">Documents</div>
                <div className="text-2xl font-semibold text-slate-900">{documentCount}</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5" style={{borderTop: "3px solid #818cf8"}}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-indigo-500" />
              </div>
              <div>
                <div className="text-xs text-slate-500">SOPs created</div>
                <div className="text-2xl font-semibold text-slate-900">{sopCount}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <AnalyticsCharts
          dailyData={dailyData}
          topQuestionsData={topQuestionsData}
          donutData={donutData}
        />

        {/* Recent activity */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <div className="text-sm font-semibold text-slate-900">Recent Activity</div>
          </div>
          {recentQueries.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-slate-400">No activity yet.</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-6 py-3">Question</th>
                  <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-6 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-6 py-3">Confidence</th>
                  <th className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider px-6 py-3">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentQueries.map((q, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-3 text-sm text-slate-800 max-w-xs truncate">{q.question}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${q.wasAnswered ? "bg-indigo-50 text-indigo-600 border border-indigo-200" : "bg-amber-50 text-amber-600 border border-amber-200"}`}>
                        {q.wasAnswered ? "Answered" : "Gap"}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full">
                          <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${Math.round(q.confidence * 100)}%` }} />
                        </div>
                        <span className="text-xs text-slate-500">{Math.round(q.confidence * 100)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-xs text-slate-400">
                      {new Date(q.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
}
