import { createId } from "@paralleldrive/cuid2";

jest.mock("@/lib/prisma", () => {
  const { getTestPrismaClient } = require("./helpers/testDb");
  const testPrisma = getTestPrismaClient();
  return {
    __esModule: true,
    default: testPrisma,
  };
});

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/lib/auth", () => ({
  authOptions: {},
}));

import { getServerSession } from "next-auth";
import { getTestPrismaClient, disconnectTestPrisma } from "./helpers/testDb";
import { POST } from "@/app/api/invites/[token]/accept/route";

const mockedGetServerSession = getServerSession as jest.Mock;
const prisma = getTestPrismaClient();

function buildAcceptRequest(): Request {
  return new Request("http://localhost/api/invites/x/accept", { method: "POST" });
}

describe("POST /api/invites/[token]/accept", () => {
  let org: { id: string };
  const inviteeEmail = `invitee-${createId()}@test.com`;

  beforeEach(async () => {
    const orgId = createId();
    org = await prisma.organization.create({
      data: { id: orgId, name: `Org ${orgId}`, slug: `org-${orgId}` },
    });

    mockedGetServerSession.mockResolvedValue({
      user: { email: inviteeEmail, name: "Invitee" },
    });
  });

  afterEach(async () => {
    await prisma.inviteToken.deleteMany({ where: { organizationId: org.id } });
    await prisma.user.deleteMany({ where: { email: inviteeEmail } });
    await prisma.organization.delete({ where: { id: org.id } });
  });

  afterAll(async () => {
    await disconnectTestPrisma();
  });

  it("rejects a token that has already been used (replay protection)", async () => {
    const token = createId();
    await prisma.inviteToken.create({
      data: {
        token,
        email: inviteeEmail,
        organizationId: org.id,
        role: "EMPLOYEE",
        expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1hr from now
        usedAt: new Date(), // already used
      },
    });

    const response = await POST(buildAcceptRequest(), { params: { token } });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("This invite has already been used.");
  });

  it("rejects a token that has expired", async () => {
    const token = createId();
    await prisma.inviteToken.create({
      data: {
        token,
        email: inviteeEmail,
        organizationId: org.id,
        role: "EMPLOYEE",
        expiresAt: new Date(Date.now() - 1000 * 60 * 60), // 1hr in the past
        usedAt: null,
      },
    });

    const response = await POST(buildAcceptRequest(), { params: { token } });

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("This invite has expired.");
  });

  it("rejects a token that doesn't exist", async () => {
    const response = await POST(buildAcceptRequest(), { params: { token: "nonexistent-token" } });

    expect(response.status).toBe(404);
  });

  it("rejects when the invite email doesn't match the logged-in user's email", async () => {
    const token = createId();
    await prisma.inviteToken.create({
      data: {
        token,
        email: `different-${createId()}@test.com`, // different from mocked session email
        organizationId: org.id,
        role: "EMPLOYEE",
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        usedAt: null,
      },
    });

    const response = await POST(buildAcceptRequest(), { params: { token } });

    expect(response.status).toBe(403);
  });

  it("accepts a valid, unused, unexpired token exactly once — second attempt is rejected", async () => {
    const token = createId();
    await prisma.inviteToken.create({
      data: {
        token,
        email: inviteeEmail,
        organizationId: org.id,
        role: "EMPLOYEE",
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        usedAt: null,
      },
    });

    const firstResponse = await POST(buildAcceptRequest(), { params: { token } });
    expect(firstResponse.status).toBe(200);
    const firstBody = await firstResponse.json();
    expect(firstBody.success).toBe(true);

    // Immediately try to reuse the same token — this is the actual
    // replay-attack scenario, not just "a used token exists in the DB."
    const secondResponse = await POST(buildAcceptRequest(), { params: { token } });
    expect(secondResponse.status).toBe(400);
    const secondBody = await secondResponse.json();
    expect(secondBody.error).toBe("This invite has already been used.");
  });
});