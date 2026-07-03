import { Readable } from "stream";
import { Worker, Job } from "bullmq";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { Prisma } from "@prisma/client";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OpenAIEmbeddings } from "@langchain/openai";
import pdf from "pdf-parse";
import { createId } from "@paralleldrive/cuid2";
import { withOrgContext } from "../../src/lib/prisma";

type PdfProcessingJobData = {
  documentId: string;
  organizationId: string;
  s3Key: string;
};

const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION,
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY as string,
  },
});

const connection = {
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
};

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

const worker = new Worker<PdfProcessingJobData>(
  "pdf-processing",
  async (job: Job<PdfProcessingJobData>) => {
    const { documentId, organizationId, s3Key } = job.data;

    console.log(`[pdfProcessor] Job ${job.id} started for document ${documentId}`);

    await withOrgContext(organizationId, (tx) =>
      tx.job.update({
        where: { documentId },
        data: { status: "PROCESSING", startedAt: new Date() },
      })
    );

    console.log(`[pdfProcessor] Downloading PDF from S3: ${s3Key}`);
    const object = await s3Client.send(
      new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: s3Key,
      })
    );
    const buffer = await streamToBuffer(object.Body as Readable);

    console.log(`[pdfProcessor] Extracting text from PDF`);
    const { text } = await pdf(buffer);
    console.log(`[pdfProcessor] Extracted ${text.length} characters`);

    console.log(`[pdfProcessor] Splitting text into chunks`);
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    const chunks = await splitter.splitText(text);
    console.log(`[pdfProcessor] Split into ${chunks.length} chunks`);

    console.log(`[pdfProcessor] Generating embeddings`);
    const embeddingsModel = new OpenAIEmbeddings({
      model: "text-embedding-3-small",
      apiKey: process.env.OPENAI_API_KEY,
    });
    const chunkTexts = chunks;
    const embeddings = await embeddingsModel.embedDocuments(chunkTexts);
    console.log(`[pdfProcessor] Generated ${embeddings.length} embeddings`);

    await withOrgContext(organizationId, async (tx) => {
      for (let index = 0; index < chunks.length; index++) {
        const chunkId = createId();
        const content = chunks[index];
        const embeddingVector = `[${embeddings[index].join(",")}]`;

        console.log(`[pdfProcessor] Inserting chunk ${index + 1}/${chunks.length}`);
        await tx.$executeRaw(
          Prisma.sql`INSERT INTO "Chunk" (id, content, embedding, "chunkIndex", "organizationId", "documentId", "accessLevel", "pageNumber")
          VALUES (${chunkId}, ${content}, ${embeddingVector}::vector, ${index}, ${organizationId}, ${documentId}, 'ALL', NULL)`
        );
      }
    });

    console.log(`[pdfProcessor] Marking document ${documentId} as READY`);
    await withOrgContext(organizationId, (tx) =>
      tx.document.update({
        where: { id: documentId },
        data: { status: "READY", processedAt: new Date() },
      })
    );

    await withOrgContext(organizationId, (tx) =>
      tx.job.update({
        where: { documentId },
        data: { status: "COMPLETED", completedAt: new Date(), progress: 100 },
      })
    );

    console.log(`[pdfProcessor] Job ${job.id} completed for document ${documentId}`);
  },
  { connection }
);

worker.on("failed", async (job, error) => {
  console.error(`[pdfProcessor] Job ${job?.id} failed:`, error);

  if (job?.data?.documentId) {
    await withOrgContext(job.data.organizationId, (tx) =>
      tx.job.update({
        where: { documentId: job.data.documentId },
        data: { status: "FAILED", errorMessage: error.message },
      })
    );
  }
});

export default worker;
