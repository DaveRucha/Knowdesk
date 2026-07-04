import { createId } from "@paralleldrive/cuid2";

// Redirect the app's real @/lib/prisma to the test database, using the
// exact same withOrgContext transaction logic as production — so this
// test genuinely exercises the RLS policy via knowdesk_app, not a
// disconnected mock and not the dev/prod database.
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

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

// route.ts imports authOptions from here just to pass it to
// getServerSession, which we're mocking anyway — but the real file
// pulls in @auth/prisma-adapter (ESM), which Jest can't parse by
// default. Stub it out entirely rather than fighting transform config.
jest.mock("@/lib/auth", () => ({
  authOptions: {},
}));

import { getServerSession } from "next-auth";
import { withOrgContext } from "@/lib/prisma";
import { getTestPrismaClient, disconnectTestPrisma } from "./helpers/testDb";
import { POST } from "@/app/api/search/route";

const mockedGetServerSession = getServerSession as jest.Mock;
const prisma = getTestPrismaClient();

describe("POST /api/search — org scoping", () => {
  let orgA: { id: string };
  let orgB: { id: string };
  let userA: { id: string };
  let docA: { id: string };
  let docB: { id: string };

  beforeEach(async () => {
    const orgAId = createId();
    const orgBId = createId();

    orgA = await prisma.organization.create({
      data: { id: orgAId, name: `Org A ${orgAId}`, slug: `org-a-${orgAId}` },
    });
    orgB = await prisma.organization.create({
      data: { id: orgBId, name: `Org B ${orgBId}`, slug: `org-b-${orgBId}` },
    });

    userA = await prisma.user.create({
      data: {
        id: createId(),
        email: `user-a-${createId()}@test.com`,
        name: "User A",
        role: "ADMIN",
        organizationId: orgA.id,
      },
    });

    docA = await withOrgContext(orgA.id, (tx) =>
      tx.document.create({
        data: {
          id: createId(),
          name: "Org A Handbook",
          s3Key: `test/${createId()}.pdf`,
          uploadedById: userA.id,
          organizationId: orgA.id,
          status: "READY",
        },
      }),
    );
    docB = await withOrgContext(orgB.id, (tx) =>
      tx.document.create({
        data: {
          id: createId(),
          name: "Org B Handbook",
          s3Key: `test/${createId()}.pdf`,
          uploadedById: userA.id,
          organizationId: orgB.id,
          status: "READY",
        },
      }),
    );

    // Identical fake embedding for both — content doesn't matter here,
    // we're proving SQL-level org isolation, not semantic relevance.
    // High similarity to itself guarantees the chunk clears the 0.63
    // threshold IF org filtering fails and it leaks through.
    const fakeVector = `[${new Array(1536).fill(0.1).join(",")}]`;

    await withOrgContext(orgA.id, (tx) =>
      tx.$executeRawUnsafe(
        `INSERT INTO "Chunk" (id, content, embedding, "chunkIndex", "organizationId", "documentId", "accessLevel", "pageNumber")
         VALUES ('${createId()}', 'Org A secret onboarding steps', '${fakeVector}'::vector, 0, '${orgA.id}', '${docA.id}', 'ALL', NULL)`,
      ),
    );
    await withOrgContext(orgB.id, (tx) =>
      tx.$executeRawUnsafe(
        `INSERT INTO "Chunk" (id, content, embedding, "chunkIndex", "organizationId", "documentId", "accessLevel", "pageNumber")
         VALUES ('${createId()}', 'Org B secret onboarding steps', '${fakeVector}'::vector, 0, '${orgB.id}', '${docB.id}', 'ALL', NULL)`,
      ),
    );
  });

  afterEach(async () => {
    await withOrgContext(orgA.id, (tx) =>
      tx.$executeRawUnsafe(`DELETE FROM "Chunk" WHERE "organizationId" = '${orgA.id}'`),
    );
    await withOrgContext(orgB.id, (tx) =>
      tx.$executeRawUnsafe(`DELETE FROM "Chunk" WHERE "organizationId" = '${orgB.id}'`),
    );
    await withOrgContext(orgA.id, (tx) =>
      tx.document.deleteMany({ where: { organizationId: orgA.id } }),
    );
    await withOrgContext(orgB.id, (tx) =>
      tx.document.deleteMany({ where: { organizationId: orgB.id } }),
    );
    await withOrgContext(orgA.id, (tx) =>
      tx.query.deleteMany({ where: { organizationId: orgA.id } }),
    );
    await withOrgContext(orgB.id, (tx) =>
      tx.query.deleteMany({ where: { organizationId: orgB.id } }),
    );
    await prisma.user.deleteMany({ where: { organizationId: orgA.id } });
    await prisma.organization.delete({ where: { id: orgA.id } });
    await prisma.organization.delete({ where: { id: orgB.id } });
  });

  afterAll(async () => {
    await disconnectTestPrisma();
  });

  it("never returns another org's chunks, even when that org has a matching document", async () => {
    mockedGetServerSession.mockResolvedValue({
      user: {
        userId: userA.id,
        organizationId: orgA.id,
        role: "ADMIN",
      },
    });

    const request = new Request("http://localhost/api/search", {
      method: "POST",
      body: JSON.stringify({ question: "What are the onboarding steps?" }),
    });

    const response = await POST(request);
    const bodyText = await response.text();

    expect(bodyText).not.toContain("Org B secret onboarding steps");
    expect(bodyText).not.toContain(orgB.id);
  });

  it("rejects the request entirely when there is no session", async () => {
    mockedGetServerSession.mockResolvedValue(null);

    const request = new Request("http://localhost/api/search", {
      method: "POST",
      body: JSON.stringify({ question: "What are the onboarding steps?" }),
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
  });
});