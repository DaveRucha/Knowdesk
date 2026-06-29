"use client";

import { useState, FormEvent, useRef, useEffect } from "react";
import { Send, Sparkles, AlertCircle, BookOpen } from "lucide-react";
import Link from "next/link";

interface Message {
  id: string;
  type: "user" | "answer" | "gap";
  content: string;
  question?: string;
}

export default function AskPage() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { id: Date.now().toString(), type: "user", content: trimmed };
    setMessages(prev => [...prev, userMsg]);
    setQuestion("");
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
      });

      if (!res.ok) throw new Error("Request failed");

      const contentType = res.headers.get("Content-Type") ?? "";

      if (contentType.includes("application/json")) {
        const data = await res.json();
        if (!data.confident) {
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            type: "gap",
            content: trimmed,
            question: trimmed,
          }]);
        }
        setLoading(false);
        return;
      }

      if (!res.body) throw new Error("No response body");

      const answerMsgId = Date.now().toString();
      setMessages(prev => [...prev, { id: answerMsgId, type: "answer", content: "" }]);
      setLoading(false);

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
              setMessages(prev => prev.map(m =>
                m.id === answerMsgId
                  ? { ...m, content: m.content + parsed.content }
                  : m
              ));
            }
          } catch { /* ignore */ }
        }
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen">

      {/* Topbar */}
      <div className="bg-white border-b border-slate-200 px-8 py-4">
        <h1 className="text-lg font-semibold text-slate-900">Ask a Question</h1>
        <p className="text-sm text-slate-500">Get instant answers from your company knowledge base</p>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">

        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
              <Sparkles className="w-7 h-7 text-indigo-500" />
            </div>
            <div className="text-sm font-semibold text-slate-700 mb-1">Ask anything about your company</div>
            <div className="text-xs text-slate-400 max-w-xs">
              Questions are answered from your uploaded documents and SOPs
            </div>
            <div className="mt-6 grid grid-cols-1 gap-2 w-full max-w-sm">
              {["How do I request time off?", "What is the onboarding process?", "What are the company values?"].map(q => (
                <button
                  key={q}
                  onClick={() => setQuestion(q)}
                  className="text-left text-xs text-slate-600 bg-white border border-slate-200 rounded-lg px-4 py-2.5 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => {
          if (msg.type === "user") {
            return (
              <div key={msg.id} className="flex justify-end">
                <div className="max-w-lg bg-indigo-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm">
                  {msg.content}
                </div>
              </div>
            );
          }

          if (msg.type === "gap") {
            return (
              <div key={msg.id} className="flex justify-start">
                <div className="max-w-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
                      <Sparkles className="w-3 h-3 text-indigo-600" />
                    </div>
                    <span className="text-xs font-medium text-slate-500">Knowdesk</span>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex items-start gap-2 mb-3">
                      <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-amber-800">
                        I don&apos;t have enough information to answer this. Would you like to create an SOP for this topic?
                      </p>
                    </div>
                    <Link
                      href={`/sops/new?topic=${encodeURIComponent(msg.question ?? "")}`}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-white border border-amber-200 rounded-lg px-3 py-1.5 hover:bg-amber-50 transition-colors"
                    >
                      <BookOpen className="w-3 h-3" />
                      Create SOP
                    </Link>
                  </div>
                </div>
              </div>
            );
          }

          if (msg.type === "answer") {
            return (
              <div key={msg.id} className="flex justify-start">
                <div className="max-w-2xl w-full">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
                      <Sparkles className="w-3 h-3 text-indigo-600" />
                    </div>
                    <span className="text-xs font-medium text-slate-500">Knowdesk</span>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm">
                    <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                      {msg.content || <span className="inline-block w-1.5 h-4 bg-indigo-400 animate-pulse rounded" />}
                    </p>
                  </div>
                </div>
              </div>
            );
          }
        })}

        {loading && (
          <div className="flex justify-start">
            <div className="max-w-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-indigo-600" />
                </div>
                <span className="text-xs font-medium text-slate-500">Knowdesk</span>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-indigo-300 rounded-full animate-bounce" style={{animationDelay: "0ms"}} />
                  <span className="w-2 h-2 bg-indigo-300 rounded-full animate-bounce" style={{animationDelay: "150ms"}} />
                  <span className="w-2 h-2 bg-indigo-300 rounded-full animate-bounce" style={{animationDelay: "300ms"}} />
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="text-sm text-red-500 text-center">{error}</div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="bg-white border-t border-slate-200 px-8 py-4">
        <form onSubmit={handleSubmit} className="flex gap-3 max-w-3xl mx-auto">
          <input
            ref={inputRef}
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question about your knowledge base..."
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
            Ask
          </button>
        </form>
      </div>

    </div>
  );
}
