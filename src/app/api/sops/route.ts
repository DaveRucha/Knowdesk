import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OpenAIEmbeddings } from "@langchain/openai";
import { createId } from "@paralleldrive/cuid2";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.organizationId || !session.user?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { organizationId, userId } = session.user;

  const body = await request.json();
  const { title, content } = body;

  if (typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  if (typeof content !== "string" || !content.trim()) {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }

  const sop = await prisma.sOP.create({
    data: {
      title,
      content,
      organization: { connect: { id: organizationId } },
      createdById: userId,
    },
  });

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  const chunks = await splitter.splitText(content);

  const embeddingsModel = new OpenAIEmbeddings({
    model: "text-embedding-3-small",
    apiKey: process.env.OPENAI_API_KEY,
  });
  const embeddings = await embeddingsModel.embedDocuments(chunks);

  for (let index = 0; index < chunks.length; index++) {
    const chunkId = createId();
    const chunkContent = chunks[index];
    const embeddingVector = `[${embeddings[index].join(",")}]`;

    await prisma.$executeRaw(
      Prisma.sql`INSERT INTO "Chunk" (id, content, embedding, "chunkIndex", "organizationId", "documentId", "sopId", "accessLevel", "pageNumber")
      VALUES (${chunkId}, ${chunkContent}, ${embeddingVector}::vector, ${index}, ${organizationId}, NULL, ${sop.id}, 'ALL', NULL)`,
    );
  }

  return NextResponse.json({ id: sop.id, title: sop.title }, { status: 201 });
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sops = await prisma.sOP.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, createdAt: true },
  });

  return NextResponse.json(sops, { status: 200 });
}
