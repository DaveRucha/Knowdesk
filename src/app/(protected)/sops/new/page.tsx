"use client";

import { useState, FormEvent, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Sparkles, Save, BookOpen } from "lucide-react";
import Link from "next/link";

function NewSopForm() {
  const searchParams = useSearchParams();
  const topicFromUrl = searchParams.get("topic") ?? "";

  const [topic, setTopic] = useState(topicFromUrl);
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

      if (!res.ok || !res.body) throw new Error("Failed to generate SOP.");

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
            if (parsed.content) setContent((prev) => prev + parsed.content);
          } catch { /* ignore */ }
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
      if (!res.ok) throw new Error("Failed to save SOP.");
      setSaveSuccess(true);
    } catch {
      setSaveError("Something went wrong while saving the SOP. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen">

      {/* Topbar */}
      <div className="bg-white border-b border-slate-200 px-8 py-4 flex items-center gap-4">
        <Link href="/sops" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to SOPs
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm font-medium text-slate-700">Generate SOP</span>
      </div>

      <div className="flex-1 p-8 max-w-3xl mx-auto w-full space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Generate SOP</h1>
            <p className="text-sm text-slate-500">Describe a process and AI will create a structured SOP</p>
          </div>
        </div>

        {/* Topic input */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <label className="block text-sm font-medium text-slate-700 mb-3">What process do you want to document?</label>
          <form onSubmit={handleGenerate} className="flex gap-3">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. employee onboarding process, expense reimbursement..."
              className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={generating || !topic.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              {generating ? "Generating..." : "Generate SOP"}
            </button>
          </form>

          {generating && (
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: "0ms"}} />
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: "150ms"}} />
                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: "300ms"}} />
              </div>
              AI is writing your SOP...
            </div>
          )}

          {generateError && (
            <div className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              {generateError}
            </div>
          )}
        </div>

        {/* Generated content */}
        {(content || generated) && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-semibold text-slate-900">Generated SOP</span>
              <span className="text-xs text-slate-400 ml-auto">Review and edit before saving</span>
            </div>
            <div className="p-6">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full min-h-96 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y"
              />
            </div>
          </div>
        )}

        {/* Save section */}
        {generated && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="text-sm font-semibold text-slate-900 mb-4">Save this SOP</div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">SOP Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter a title for this SOP"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={saving || !title.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Saving..." : "Save SOP"}
                </button>
                {saveSuccess && (
                  <div className="flex items-center gap-1.5 text-sm text-emerald-600">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center text-xs">✓</span>
                    SOP saved successfully!
                  </div>
                )}
              </div>
              {saveError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  {saveError}
                </div>
              )}
            </form>
          </div>
        )}

      </div>
    </div>
  );
}

export default function NewSopPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400 text-sm">Loading...</div>}>
      <NewSopForm />
    </Suspense>
  );
}
