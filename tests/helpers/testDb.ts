import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

// Integration tests only: connects to a real Postgres database. Loads from
// .env.test.local (gitignored) so it can never silently fall back to the
// dev/prod DATABASE_URL used by the rest of the app.
dotenv.config({ path: ".env.test.local" });

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

function assertSafeTestDatabaseUrl(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("TEST_DATABASE_URL is not a valid connection string.");
  }

  const databaseName = parsed.pathname.replace(/^\//, "");
  if (!/test/i.test(databaseName)) {
    throw new Error(
      `TEST_DATABASE_URL points at database "${databaseName}", which doesn't ` +
        'look like a test database (expected the name to contain "test", ' +
        "e.g. knowdesk_test). Refusing to connect — this guard exists so " +
        "integration tests can never accidentally run against dev/prod data.",
    );
  }
}

if (!TEST_DATABASE_URL) {
  throw new Error(
    "TEST_DATABASE_URL is not set. Integration tests require a dedicated " +
      "Postgres test database (e.g. knowdesk_test). Add it to .env.test.local " +
      "(gitignored) — this is intentionally separate from DATABASE_URL so " +
      "tests never touch the dev/prod database.",
  );
}

assertSafeTestDatabaseUrl(TEST_DATABASE_URL);

let testPrisma: PrismaClient | null = null;

/** Lazily creates (or returns) a PrismaClient pointed at TEST_DATABASE_URL. */
export function getTestPrismaClient(): PrismaClient {
  if (!testPrisma) {
    testPrisma = new PrismaClient({
      datasources: { db: { url: TEST_DATABASE_URL } },
    });
  }
  return testPrisma;
}

/** Closes the test connection; call from an `afterAll` in integration suites. */
export async function disconnectTestPrisma(): Promise<void> {
  if (testPrisma) {
    await testPrisma.$disconnect();
    testPrisma = null;
  }
}
