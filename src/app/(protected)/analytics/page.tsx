import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";

import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (!session.user.organizationId) {
    redirect("/register");
  }

  if (session.user.role !== "ADMIN") {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
        </div>
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            You don&apos;t have permission to view this page.
          </CardContent>
        </Card>
      </div>
    );
  }

  const { organizationId } = session.user;

  const [
    totalQueries,
    answeredQueries,
    documentCount,
    sopCount,
    topQuestions,
    recentQueries,
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
      take: 10,
      select: {
        question: true,
        wasAnswered: true,
        confidence: true,
        createdAt: true,
      },
    }),
  ]);

  const answerRate =
    totalQueries === 0
      ? 0
      : Math.round((answeredQueries / totalQueries) * 100);

  const stats = [
    { label: "Total Questions Asked", value: totalQueries },
    { label: "Answer Rate", value: `${answerRate}%` },
    { label: "Documents Uploaded", value: documentCount },
    { label: "SOPs Created", value: sopCount },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Knowledge base usage insights</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value }) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardDescription>{label}</CardDescription>
              <CardTitle className="text-3xl">{value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Most Asked Questions</CardTitle>
        </CardHeader>
        <CardContent>
          {topQuestions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No questions asked yet.
            </p>
          ) : (
            <ul className="space-y-3">
              {topQuestions.map((q) => (
                <li
                  key={q.question}
                  className="flex items-center justify-between gap-4"
                >
                  <span className="text-sm">{q.question}</span>
                  <Badge variant="secondary">{Number(q.count)}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentQueries.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No recent activity.
            </p>
          ) : (
            <ul className="space-y-3">
              {recentQueries.map((q, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between gap-4 border-b pb-3 last:border-b-0 last:pb-0"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{q.question}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(q.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      q.wasAnswered
                        ? "border-green-500 text-green-600"
                        : "border-red-500 text-red-600"
                    }
                  >
                    {q.wasAnswered ? "Answered" : "Unanswered"}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
