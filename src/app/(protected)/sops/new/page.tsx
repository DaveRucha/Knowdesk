"use client";

import { useState, FormEvent } from "react";

export default function NewSopPage() {
  const [topic, setTopic] = useState("");
  const [content, setContent] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [generateError, setGenerateError] = useState("");

  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  async function handleGenerate(e: FormEvent) {
    e.preventDefault();

    const trimmedTopic = topic.trim();
    if (!trimmedTopic || generating) return;

    setContent("");
    setGenerated(false);
    setGenerateError("");
    setSaveSuccess(false);
    setSaveError("");
    setGenerating(true);

    try {
      const res = await fetch("/api/sops/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: trimmedTopic }),
      });

      if (!res.ok || !res.body) {
        throw new Error("Failed to generate SOP. Please try again.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

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
              setContent((prev) => prev + parsed.content);
            }
          } catch {
            // ignore malformed SSE chunk
          }
        }
      }

      setTitle(trimmedTopic);
      setGenerated(true);
    } catch {
      setGenerateError("Something went wrong while generating the SOP. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle || saving) return;

    setSaving(true);
    setSaveError("");
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/sops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmedTitle, content }),
      });

      if (!res.ok) {
        throw new Error("Failed to save SOP. Please try again.");
      }

      setSaveSuccess(true);
    } catch {
      setSaveError("Something went wrong while saving the SOP. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">New SOP</h1>
        <p className="text-muted-foreground">
          Generate a Standard Operating Procedure from a topic
        </p>
      </div>

      <form onSubmit={handleGenerate} className="flex gap-2">
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. employee onboarding process"
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          disabled={generating || !topic.trim()}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          Generate SOP
        </button>
      </form>

      {generating && (
        <p className="text-sm text-muted-foreground">Generating...</p>
      )}

      {generateError && (
        <p className="text-sm text-destructive">{generateError}</p>
      )}

      {content && (
        <div className="rounded-md border border-border bg-card p-4">
          <pre className="whitespace-pre-wrap text-sm text-card-foreground">
            {content}
          </pre>
        </div>
      )}

      {generated && (
        <form
          onSubmit={handleSave}
          className="space-y-3 rounded-md border border-border bg-muted p-4"
        >
          <div className="space-y-1">
            <label
              htmlFor="sop-title"
              className="text-sm font-medium text-foreground"
            >
              Title
            </label>
            <input
              id="sop-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="SOP title"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <button
            type="submit"
            disabled={saving || !title.trim()}
            className="rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save SOP"}
          </button>

          {saveSuccess && (
            <p className="text-sm text-green-600">SOP saved successfully!</p>
          )}

          {saveError && <p className="text-sm text-destructive">{saveError}</p>}
        </form>
      )}
    </div>
  );
}
