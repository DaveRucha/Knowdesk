import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const suggestions = await prisma.query.findMany({
    where: {
      organizationId: session.user.organizationId,
      wasAnswered: true,
    },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { question: true },
  });

  const unique = [...new Set(suggestions.map(q => q.question))].slice(0, 3);

  return NextResponse.json(unique);
}