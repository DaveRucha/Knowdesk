import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, slug } = body;

  if (typeof name !== "string" || !name || typeof slug !== "string" || !slug) {
    return NextResponse.json(
      { error: "name and slug are required strings" },
      { status: 400 }
    );
  }

  try {
    const organizationId = await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: { name, slug },
      });

      await tx.user.update({
        where: { email: session.user!.email! },
        data: {
          organizationId: organization.id,
          role: "ADMIN",
        },
      });

      return organization.id;
    });

    return NextResponse.json({ organizationId }, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Slug already exists" },
        { status: 400 }
      );
    }
    throw error;
  }
}
