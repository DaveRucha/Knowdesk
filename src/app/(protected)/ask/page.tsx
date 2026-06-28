"use client";

import { useState, FormEvent } from "react";

export default function AskPage() {
  const [question, setQuestion] = useState("");
  const [submittedQuestion, setSubmittedQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [confident, setConfident] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const trimmed = question.trim();
    if (!trimmed || loading) return;

    setSubmittedQuestion(trimmed);
    setAnswer("");
    setConfident(null);
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
      });

      if (!res.ok) {
        throw new Error("Request failed");
      }

      const contentType = res.headers.get("Content-Type") ?? "";

      if (contentType.includes("application/json")) {
        const data = await res.json();
        setConfident(Boolean(data.confident));
        return;
      }

      if (!res.body) {
        throw new Error("No response body");
      }

      setConfident(true);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let receivedFirstToken = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const event of events) {
          const line = event.trim();
          if (!line.startsWith("data:")) continue;

          const payload = line.slice(5).trim();
          if (payload === "[DONE]") continue;

          try {
            const parsed = JSON.parse(payload);
            if (parsed.content) {
              if (!receivedFirstToken) {
                receivedFirstToken = true;
                setLoading(false);
              }
              setAnswer((prev) => prev + parsed.content);
            }
          } catch {
            // ignore malformed SSE chunk
          }
        }
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Ask a Question</h1>
        <p className="text-muted-foreground">
          Ask anything about your company knowledge base
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Type your question..."
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          Submit
        </button>
      </form>

      {loading && (
        <p className="text-sm text-muted-foreground">Thinking...</p>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {!loading && confident === false && (
        <div className="space-y-3 rounded-md border border-border bg-muted p-4">
          <p className="text-sm text-foreground">
            I don&apos;t have enough information to answer this. Would you
            like to create an SOP for this topic?
          </p>
          <button
            onClick={() => {}}
            className="rounded-md bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground hover:bg-secondary/80"
          >
            Create SOP
          </button>
        </div>
      )}

      {confident === true && answer && (
        <div className="rounded-md border border-border bg-card p-4">
          <p className="whitespace-pre-wrap text-sm text-card-foreground">
            {answer}
          </p>
        </div>
      )}

      {submittedQuestion && confident !== null && (
        <p className="text-xs text-muted-foreground">
          Asked: {submittedQuestion}
        </p>
      )}
    </div>
  );
}
