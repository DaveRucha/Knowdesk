import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { organizationId } = session.user;

  const gaps = await prisma.$queryRaw<
    Array<{
      question: string;
      count: bigint;
      latest_asked: Date;
      avg_confidence: number;
      is_resolved: boolean;
    }>
  >(Prisma.sql`
    SELECT
      q.question,
      COUNT(*) as count,
      MAX(q."createdAt") as latest_asked,
      AVG(q.confidence) as avg_confidence,
      EXISTS (
        SELECT 1 FROM "SOP" s
        WHERE s."organizationId" = ${organizationId}
        AND LOWER(s.title) LIKE LOWER(CONCAT('%', q.question, '%'))
      ) as is_resolved
    FROM "Query" q
    WHERE q."organizationId" = ${organizationId}
    AND q."wasAnswered" = false
    GROUP BY q.question
    ORDER BY count DESC, latest_asked DESC
  `);

  return NextResponse.json(
    gaps.map((gap) => ({ ...gap, count: Number(gap.count) })),
    { status: 200 },
  );
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { organizationId } = session.user;

  const body = await request.json();
  const { question } = body;

  if (typeof question !== "string" || !question.trim()) {
    return NextResponse.json(
      { error: "question is required" },
      { status: 400 },
    );
  }

  await prisma.query.deleteMany({
    where: { question, organizationId },
  });

  return NextResponse.json({ success: true }, { status: 200 });
}
