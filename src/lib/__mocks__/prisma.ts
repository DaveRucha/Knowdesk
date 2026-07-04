import type { PrismaClient } from "@prisma/client";
import { mockDeep } from "jest-mock-extended";

/**
 * Manual mock for src/lib/prisma.ts, used only when a test file opts in
 * with `jest.mock("@/lib/prisma")`. Never applied globally, so integration
 * tests that import the real client are unaffected.
 */
const prismaMock = mockDeep<PrismaClient>();

export const withOrgContext = jest.fn(
  async <T>(
    _organizationId: string,
    fn: (tx: PrismaClient) => Promise<T>,
  ): Promise<T> => fn(prismaMock),
);

export default prismaMock;
