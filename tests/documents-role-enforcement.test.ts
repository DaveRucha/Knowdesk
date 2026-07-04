import { createId } from "@paralleldrive/cuid2";

// Mock S3 and BullMQ entirely — this test verifies role enforcement,
// not real file storage or queueing. No network/Redis I/O in a unit test.
jest.mock("@aws-sdk/client-s3", () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({}),
  })),
  PutObjectCommand: jest.fn(),
}));

jest.mock("bullmq", () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn().mockResolvedValue({}),
  })),
}));

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
import { POST } from "@/app/api/documents/route";

const mockedGetServerSession = getServerSession as jest.Mock;
const prisma = getTestPrismaClient();

function buildUploadRequest(): Request {
  const formData = new FormData();
  const fakePdf = new File(["%PDF-1.4 fake content"], "handbook.pdf", {
    type: "application/pdf",
  });
  formData.append("file", fakePdf);

  return new Request("http://localhost/api/documents", {
    method: "POST",
    body: formData,
  });
}

describe("POST /api/documents — role enforcement", () => {
  let org: { id: string };
  let adminUser: { id: string };
  let employeeUser: { id: string };

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

    employeeUser = await prisma.user.create({
      data: {
        id: createId(),
        email: `employee-${createId()}@test.com`,
        name: "Employee User",
        role: "EMPLOYEE",
        organizationId: org.id,
      },
    });
  });

  afterEach(async () => {
    await withOrgContext(org.id, (tx) =>
      tx.job.deleteMany({ where: { organizationId: org.id } }),
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

  it("allows an ADMIN to upload a document", async () => {
    mockedGetServerSession.mockResolvedValue({
      user: {
        userId: adminUser.id,
        organizationId: org.id,
        role: "ADMIN",
      },
    });

    const response = await POST(buildUploadRequest());

    expect(response.status).toBe(202);
    const body = await response.json();
    expect(body.documentId).toBeDefined();
  });

  it("blocks an EMPLOYEE from uploading a document", async () => {
    mockedGetServerSession.mockResolvedValue({
      user: {
        userId: employeeUser.id,
        organizationId: org.id,
        role: "EMPLOYEE",
      },
    });

    const response = await POST(buildUploadRequest());

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toBe("Forbidden");
  });

  it("rejects the request when there is no session at all", async () => {
    mockedGetServerSession.mockResolvedValue(null);

    const response = await POST(buildUploadRequest());

    expect(response.status).toBe(401);
  });
});