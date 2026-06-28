import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { organizationId } = session.user;

  await prisma.chunk.deleteMany({
    where: { sopId: params.id, organizationId },
  });

  await prisma.sOP.deleteMany({
    where: { id: params.id, organizationId },
  });

  return NextResponse.json({ success: true }, { status: 200 });
}
