import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendInviteEmail } from "@/lib/email";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { email, role } = await request.json();

  if (!email || !role) {
    return NextResponse.json({ error: "Email and role are required" }, { status: 400 });
  }

  const { organizationId } = session.user;

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
  });

  if (!org) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  // Check if user already exists in this org
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser && existingUser.organizationId === organizationId) {
    return NextResponse.json({ error: "This user is already a member of your organization" }, { status: 400 });
  }

  // Expire any existing unused invites for this email + org
  await prisma.inviteToken.updateMany({
    where: { email, organizationId, usedAt: null },
    data: { expiresAt: new Date() },
  });

  // Create new invite token
  const invite = await prisma.inviteToken.create({
    data: {
      email,
      role,
      organizationId,
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
    },
  });

  const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${invite.token}`;

  await sendInviteEmail({
    to: email,
    inviterName: session.user.name ?? "Your admin",
    orgName: org.name,
    role: role === "ADMIN" ? "Admin" : "Employee",
    inviteUrl,
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
