import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { Queue } from "bullmq";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION,
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY as string,
  },
});

const documentQueue = new Queue("pdf-processing", {
  connection: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD,
  },
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const organizationId = session.user.organizationId;

  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File) || file.type !== "application/pdf") {
    return NextResponse.json(
      { error: "A PDF file is required" },
      { status: 400 }
    );
  }

  const s3Key = `${organizationId}/${Date.now()}-${file.name}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: s3Key,
      Body: buffer,
      ContentType: "application/pdf",
    })
  );

  const { documentId, jobId } = await prisma.$transaction(async (tx) => {
    const document = await tx.document.create({
      data: {
        name: file.name,
        s3Key,
        status: "PROCESSING",
        accessLevel: "ALL",
        uploadedById: session.user.userId,
        organizationId,
      },
    });

    const job = await tx.job.create({
      data: {
        documentId: document.id,
        status: "QUEUED",
        organizationId,
      },
    });

    return { documentId: document.id, jobId: job.id };
  });

  await documentQueue.add("process-pdf", { documentId, organizationId, s3Key });

  return NextResponse.json({ documentId, jobId }, { status: 202 });
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const documents = await prisma.document.findMany({
    where: { organizationId: session.user.organizationId },
    include: { job: true },
  });

  return NextResponse.json(documents, { status: 200 });
}
