import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION,
  credentials: {
    accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY as string,
  },
});

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const document = await prisma.document.findFirst({
    where: { id: params.id, organizationId: session.user.organizationId },
  });

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: document.s3Key,
    }),
  );

  await prisma.document.delete({ where: { id: document.id } });

  return NextResponse.json({ success: true }, { status: 200 });
}
