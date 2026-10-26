
"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

const AGENTS = [
  { value: "support-agent", label: "Support" },
  { value: "sales-agent", label: "Sales" },
  { value: "knowledge-agent", label: "Knowledge Base" },
];

export default function IngestPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("customer-support");
  const [agentId, setAgentId] = useState("support-agent");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          category,
          agentId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save knowledge.");
      }

      setMessage(
        `Knowledge saved successfully. Assigned agent: ${AGENTS.find((agent) => agent.value === agentId)?.label}. ID: ${data.id}`
      );
      setTitle("");
      setContent("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-5 py-12 text-white sm:py-20">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/"
          className="text-sm text-cyan-400 hover:text-cyan-300"
        >
          ← Back to Search
        </Link>

        <div className="mb-8 mt-8">
          <p className="text-sm font-medium text-cyan-400">
            QDRANT · DATA INGESTION
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight">
            Add Knowledge
          </h1>
          <p className="mt-3 leading-7 text-slate-400">
            Save information to your knowledge base and assign it to an AI
            agent. Each agent can retrieve its own assigned knowledge.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8"
        >
          <div>
            <label
              htmlFor="title"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Knowledge Title
            </label>
            <input
              id="title"
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Shipping Policy"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label
              htmlFor="content"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Content
            </label>
            <textarea
              id="content"
              required
              rows={5}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Enter the information the AI agent should know..."
              className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label
              htmlFor="category"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Category
            </label>
            <input
              id="category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              placeholder="e.g. customer-support"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label
              htmlFor="agentId"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Assign to AI Agent
            </label>
            <select
              id="agentId"
              required
              value={agentId}
              onChange={(event) => setAgentId(event.target.value)}
              disabled={loading}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400 disabled:opacity-50"
            >
              {AGENTS.map((agent) => (
                <option key={agent.value} value={agent.value}>
                  {agent.label}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              This knowledge will only be returned when searching with the
              selected agent.
            </p>
          </div>

          {message && (
            <div
              role="status"
              className="break-words rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300"
            >
              {message}
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="break-words rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !title.trim() || !content.trim()}
            className="w-full rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Saving Knowledge..." : "Save to Qdrant"}
          </button>
        </form>
      </div>
    </main>
  );
}
