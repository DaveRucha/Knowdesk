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

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/lib/auth", () => ({
  authOptions: {},
}));

import { getServerSession } from "next-auth";
import { withOrgContext } from "@/lib/prisma";
import { getTestPrismaClient, disconnectTestPrisma } from "./helpers/testDb";
import { POST } from "@/app/api/search/route";

const mockedGetServerSession = getServerSession as jest.Mock;
const prisma = getTestPrismaClient();

// The global OpenAI mock (jest.setup.ts) always embeds the incoming
// question as a fixed vector of all 0.001. To deterministically land
// BELOW the 0.63 confidence threshold but still ABOVE the 0.05 logging
// floor, we build a chunk vector that shares the same sign on ~65% of
// dimensions and flips the rest — cosine similarity between two equal-
// magnitude vectors reduces to (matching - flipped) / totalDims, so
// flipping a known fraction gives a predictable, reproducible similarity.
function buildPartiallyCorrelatedVector(fractionFlipped: number): string {
  const dims = 1536;
  const flipCount = Math.round(dims * fractionFlipped);
  const values: number[] = [];
  for (let i = 0; i < dims; i++) {
    values.push(i < flipCount ? -0.001 : 0.001);
  }
  return `[${values.join(",")}]`;
}

describe("POST /api/search — gaps logging for unanswered questions", () => {
  let org: { id: string };
  let adminUser: { id: string };
  let doc: { id: string };

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

    doc = await withOrgContext(org.id, (tx) =>
      tx.document.create({
        data: {
          id: createId(),
          name: "Handbook",
          s3Key: `test/${createId()}.pdf`,
          uploadedById: adminUser.id,
          organizationId: org.id,
          status: "READY",
        },
      }),
    );
  });

  afterEach(async () => {
    await withOrgContext(org.id, (tx) =>
      tx.$executeRawUnsafe(`DELETE FROM "Chunk" WHERE "organizationId" = '${org.id}'`),
    );
    await withOrgContext(org.id, (tx) =>
      tx.query.deleteMany({ where: { organizationId: org.id } }),
    );
    await withOrgContext(org.id, (tx) =>
      tx.document.deleteMany({ where: { organizationId: org.id } }),
    );
    await prisma.user.deleteMany({ where: { organizationId: org.id } });
    await prisma.organization.delete({ where: { id: org.id } });
  });

  afterAll(async () => {
    await disconnectTestPrisma();
  });

  it("logs a Query row with wasAnswered: false when similarity is below the confidence threshold", async () => {
    // ~35% overlap fraction => cosine similarity ≈ 0.30 — comfortably
    // below CONFIDENCE_THRESHOLD (0.63) but above the 0.05 logging floor.
    const lowConfidenceVector = buildPartiallyCorrelatedVector(0.35);

    await withOrgContext(org.id, (tx) =>
      tx.$executeRawUnsafe(
        `INSERT INTO "Chunk" (id, content, embedding, "chunkIndex", "organizationId", "documentId", "accessLevel", "pageNumber")
         VALUES ('${createId()}', 'Some tangentially related content', '${lowConfidenceVector}'::vector, 0, '${org.id}', '${doc.id}', 'ALL', NULL)`,
      ),
    );

    const question = "What is our policy on parental leave for new employees?";
    const request = new Request("http://localhost/api/search", {
      method: "POST",
      body: JSON.stringify({ question }),
    });

    const response = await POST(request);

    // Route returns a plain 200 JSON with confident: false when nothing
    // clears the threshold (not a stream).
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.confident).toBe(false);

    const loggedQuery = await withOrgContext(org.id, (tx) =>
      tx.query.findFirst({
        where: { organizationId: org.id, question },
      }),
    );

    expect(loggedQuery).not.toBeNull();
    expect(loggedQuery!.wasAnswered).toBe(false);
    expect(loggedQuery!.organizationId).toBe(org.id);
    // Confidence should reflect the actual (sub-threshold) similarity,
    // not be zeroed out just because it didn't qualify.
    expect(loggedQuery!.confidence).toBeGreaterThan(0.05);
    expect(loggedQuery!.confidence).toBeLessThan(0.63);
  });

  it("does not log a Query row at all for very short questions (below the 15-char floor)", async () => {
    const shortQuestion = "leave policy?"; // 13 chars, under the floor

    const request = new Request("http://localhost/api/search", {
      method: "POST",
      body: JSON.stringify({ question: shortQuestion }),
    });

    await POST(request);

    const loggedQuery = await withOrgContext(org.id, (tx) =>
      tx.query.findFirst({
        where: { organizationId: org.id, question: shortQuestion },
      }),
    );

    expect(loggedQuery).toBeNull();
  });
});