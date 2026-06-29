import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import OpenAI from "openai";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const CONFIDENCE_THRESHOLD = 0.65;

const SYSTEM_PROMPT =
  "You are a helpful company knowledge assistant. Answer the user's question based only on the provided context. Be concise and cite which document the information came from.";

interface ChunkMatch {
  id: string;
  content: string;
  documentId: string | null;
  similarity: number;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.organizationId || !session.user?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { organizationId, userId } = session.user;

  const body = await request.json();
  const { question } = body;

  if (typeof question !== "string" || !question.trim()) {
    return NextResponse.json(
      { error: "question is required" },
      { status: 400 },
    );
  }

  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: question,
  });
  const embeddingLiteral = `[${embeddingResponse.data[0].embedding.join(",")}]`;

  const isAdmin = session.user.role === "ADMIN";

  const matches = await prisma.$queryRaw<ChunkMatch[]>(Prisma.sql`
      SELECT id, content, "documentId", 1 - (embedding <=> ${embeddingLiteral}::vector) as similarity
      FROM "Chunk"
      WHERE "organizationId" = ${organizationId}
      AND (
        "accessLevel" = 'ALL'
        ${isAdmin ? Prisma.sql`OR "accessLevel" = 'ADMIN_ONLY'` : Prisma.sql``}
      )
      ORDER BY embedding <=> ${embeddingLiteral}::vector
      LIMIT 5
    `);

  const confidentChunks = matches.filter(
    (chunk) => Number(chunk.similarity) >= CONFIDENCE_THRESHOLD,
  );
  const wasAnswered = confidentChunks.length > 0;
  const confidence = Number(matches[0]?.similarity ?? 0);

  if (question.trim().length >= 15 && Number(confidence) >= 0.05) {
    await prisma.query.create({
      data: {
        question,
        wasAnswered,
        confidence,
        user: { connect: { id: userId } },
        organization: { connect: { id: organizationId } },
      },
    });
  }

  if (!wasAnswered) {
    return NextResponse.json(
      { answer: null, confident: false, chunks: [] },
      { status: 200 },
    );
  }

  const documents = await prisma.document.findMany({
    where: {
      id: {
        in: confidentChunks
          .map((chunk) => chunk.documentId)
          .filter((id): id is string => !!id),
      },
    },
    select: { id: true, name: true },
  });
  const documentNameById = new Map(documents.map((doc) => [doc.id, doc.name]));

  const context = confidentChunks
    .map((chunk) => {
      const documentName = chunk.documentId
        ? documentNameById.get(chunk.documentId) ?? "Unknown document"
        : "Unknown document";
      return `[Source: ${documentName}]\n${chunk.content}`;
    })
    .join("\n\n");

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    stream: true,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Context:\n${context}\n\nQuestion: ${question}` },
    ],
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const part of completion) {
          const content = part.choices[0]?.delta?.content;
          if (content) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ content })}\n\n`),
            );
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (error) {
        controller.error(error);
        return;
      }
      controller.close();
    },
  });

  return new NextResponse(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
