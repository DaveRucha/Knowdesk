import { createId } from "@paralleldrive/cuid2";

jest.mock("@/lib/prisma", () => {
  const { getTestPrismaClient } = require("./helpers/testDb");
  const testPrisma = getTestPrismaClient();

  const withOrgContext = async (organizationId: string, fn: (tx: any) => Promise<any>) => {
    return testPrisma.$transaction(async (tx: any) => {
      await tx.$executeRawUnsafe(
        `SET LOCAL app.current_org_id = '${organizationId.replace(/'/g, "''")}'`,
      );
      return fn(tx);
    });
  };

  return {
    __esModule: true,
    default: testPrisma,
    withOrgContext,
  };
});

// Separate package from the plain `openai` client already mocked
// globally in jest.setup.ts — @langchain/openai's OpenAIEmbeddings
// validates for an API key at construction time, so it needs its own
// mock here regardless of the global one.
jest.mock("@langchain/openai", () => ({
  OpenAIEmbeddings: jest.fn().mockImplementation(() => ({
    embedDocuments: jest.fn().mockImplementation((texts: string[]) =>
      Promise.resolve(texts.map(() => new Array(1536).fill(0.001))),
    ),
  })),
}));

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/lib/auth", () => ({
  authOptions: {},
}));

import { getServerSession } from "next-auth";
import { withOrgContext } from "@/lib/prisma";
import { getTestPrismaClient, disconnectTestPrisma } from "./helpers/testDb";
import { POST } from "@/app/api/sops/route";

const mockedGetServerSession = getServerSession as jest.Mock;
const prisma = getTestPrismaClient();

function buildSopRequest(title: string, content: string): Request {
  return new Request("http://localhost/api/sops", {
    method: "POST",
    body: JSON.stringify({ title, content }),
  });
}

describe("POST /api/sops — SOP generation", () => {
  let org: { id: string };
  let adminUser: { id: string };

  beforeEach(async () => {
    const orgId = createId();
    org = await prisma.organization.create({
      data: { id: orgId, name: `Org ${orgId}`, slug: `org-${orgId}` },
    });

    adminUser = await prisma.user.create({
      data: {
        id: createId(),
        email: `admin-${createId()}@test.com`,
        name: "Admin User",
        role: "ADMIN",
        organizationId: org.id,
      },
    });

    mockedGetServerSession.mockResolvedValue({
      user: {
        userId: adminUser.id,
        organizationId: org.id,
        role: "ADMIN",
      },
    });
  });

  afterEach(async () => {
    await withOrgContext(org.id, (tx) =>
      tx.$executeRawUnsafe(`DELETE FROM "Chunk" WHERE "organizationId" = '${org.id}'`),
    );
    await withOrgContext(org.id, (tx) =>
      tx.sOP.deleteMany({ where: { organizationId: org.id } }),
    );
    await prisma.user.deleteMany({ where: { organizationId: org.id } });
    await prisma.organization.delete({ where: { id: org.id } });
  });

  afterAll(async () => {
    await disconnectTestPrisma();
  });

  it("saves the SOP with the correct organizationId from the session, not from the request body", async () => {
    const response = await POST(
      buildSopRequest("Onboarding SOP", "Step 1: create your account. Step 2: set up your laptop."),
    );

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.id).toBeDefined();

    // Read it back directly from the DB, scoped to this org, to prove
    // the row actually landed with the right organizationId — not just
    // that the API returned 201.
    const savedSop = await withOrgContext(org.id, (tx) =>
      tx.sOP.findUnique({ where: { id: body.id } }),
    );

    expect(savedSop).not.toBeNull();
    expect(savedSop!.organizationId).toBe(org.id);
    expect(savedSop!.title).toBe("Onboarding SOP");
  });

  it("also creates Chunk rows for the SOP scoped to the same organizationId", async () => {
    const response = await POST(
      buildSopRequest(
        "Deploy SOP",
        "Step 1: run the build. Step 2: push to production. Step 3: verify health checks.",
      ),
    );
    const body = await response.json();

    const chunks = await withOrgContext(org.id, (tx) =>
      tx.$queryRawUnsafe<{ sopId: string; organizationId: string }[]>(
        `SELECT "sopId", "organizationId" FROM "Chunk" WHERE "sopId" = '${body.id}'`,
      ),
    );

    expect(chunks.length).toBeGreaterThan(0);
    for (const chunk of chunks) {
      expect(chunk.organizationId).toBe(org.id);
    }
  });

  it("rejects when content is missing", async () => {
    const response = await POST(buildSopRequest("Title only", ""));
    expect(response.status).toBe(400);
  });

  it("rejects a non-ADMIN user", async () => {
    const employeeUser = await prisma.user.create({
      data: {
        id: createId(),
        email: `employee-${createId()}@test.com`,
        name: "Employee",
        role: "EMPLOYEE",
        organizationId: org.id,
      },
    });
    mockedGetServerSession.mockResolvedValue({
      user: {
        userId: employeeUser.id,
        organizationId: org.id,
        role: "EMPLOYEE",
      },
    });

    const response = await POST(buildSopRequest("Blocked SOP", "Some content here."));
    expect(response.status).toBe(403);
  });
});