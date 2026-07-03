import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
// use `prisma` in your application to read and write data in your DB

export default prisma;

/**
 * Runs `fn` inside a transaction with the Postgres session setting
 * `app.current_org_id` set for the duration of the transaction, so
 * Row Level Security policies scoped to that setting are enforced.
 *
 * `organizationId` must come from a trusted source (e.g. the session
 * token), never directly from user input. SET LOCAL doesn't support
 * bind parameters, so the value is escaped and inlined instead.
 */
export async function withOrgContext<T>(
  organizationId: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(
      `SET LOCAL app.current_org_id = '${organizationId.replace(/'/g, "''")}'`
    );
    return fn(tx);
  });
}
