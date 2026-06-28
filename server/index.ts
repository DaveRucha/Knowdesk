import { config } from "dotenv";
import { resolve } from "path";

// Must load env BEFORE any other imports
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

// Dynamic import ensures env is loaded first
async function main() {
  const { default: worker } = await import("./processors/pdfProcessor");
  console.log("[worker] BullMQ worker started and listening for jobs...");
}

main().catch(console.error);
