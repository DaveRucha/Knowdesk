import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { withOrgContext } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organizationId = session.user.organizationId;

  const suggestions = await withOrgContext(organizationId, (tx) =>
    tx.query.findMany({
      where: {
        organizationId,
        wasAnswered: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { question: true },
    })
  );

  const seen = new Set<string>();
  const unique = suggestions.map(q => q.question).filter(q => {
    if (seen.has(q)) return false;
    seen.add(q);
    return true;
  }).slice(0, 3);

  return NextResponse.json(unique);
}