import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import OpenAI from "openai";
import { authOptions } from "@/lib/auth";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are an expert at writing Standard Operating Procedures (SOPs) for companies.
Generate a clear, structured SOP in markdown format with these exact sections:
# [SOP Title]

## Purpose
## Scope
## Responsibilities
## Procedure
(numbered steps)
## Related Documents

Be specific, actionable, and professional.`;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { topic } = body;

  if (typeof topic !== "string" || !topic.trim()) {
    return NextResponse.json({ error: "topic is required" }, { status: 400 });
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    stream: true,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Write an SOP for: ${topic}` },
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
