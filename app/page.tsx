"use client";

import { FormEvent, useRef, useState } from "react";
import Link from "next/link";
import { Fraunces, Figtree } from "next/font/google";
import {
  Search,
  Upload,
  Database,
  FileText,
  Plus,
  LoaderCircle,
  ChevronDown,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const display = Fraunces({ subsets: ["latin"], weight: ["400", "600"] });
const body = Figtree({ subsets: ["latin"] });

type SearchResult = {
  id: string | number;
  score: number;
  payload?: {
    title?: string;
    content?: string;
    category?: string;
    agent_id?: string;
  };
};

const AGENTS = [
  { value: "support-agent", label: "Support" },
  { value: "sales-agent", label: "Sales" },
  { value: "knowledge-agent", label: "Knowledge Base" },
];

const SUGGESTIONS = [
  "How long is the refund period?",
  "What are the customer support hours?",
  "What is the shipping policy?",
];

/* Palette
   ink      #0b1218   page
   surface  #111b24   cards / search
   raised   #16222d   hover
   line     #1f2f3c   borders
   text     #e8eef3   primary text
   muted    #8fa1b0   secondary text
   faint    #5d7080   tertiary text
   saffron  #e9b44c   accent
*/

function ResultCard({ result }: { result: SearchResult }) {
  const [expanded, setExpanded] = useState(false);
  const content = result.payload?.content || "No content available.";
  const isLong = content.length > 280;
  const match = Math.max(0, Math.min(1, result.score));
  const percent = Math.round(match * 100);

  return (
    <article className="rounded-xl border border-[#1f2f3c] bg-[#111b24] p-5 transition-colors hover:border-[#2c4152] sm:p-6">
      <div className="flex items-start gap-4">
        <div className="mt-0.5 hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#16222d] text-[#8fa1b0] sm:flex">
          <FileText className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3
                className={`${display.className} break-words text-lg font-semibold leading-snug text-[#e8eef3]`}
              >
                {result.payload?.title || `Knowledge point ${result.id}`}
              </h3>
              {result.payload?.category && (
                <p className="mt-1 text-sm text-[#8fa1b0]">
                  {result.payload.category}
                </p>
              )}
            </div>

            <div
              className="shrink-0 text-right"
              title={`Raw score ${result.score.toFixed(4)}`}
            >
              <p className="text-sm font-semibold tabular-nums text-[#e9b44c]">
                {percent}%
              </p>
              <div className="mt-1.5 h-1 w-14 overflow-hidden rounded-full bg-[#1f2f3c]">
                <div
                  className="h-full rounded-full bg-[#e9b44c]"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-[#5d7080]">match</p>
            </div>
          </div>

          <p
            className={`mt-4 whitespace-pre-wrap break-words text-[15px] leading-7 text-[#b6c3ce] ${
              expanded ? "" : "line-clamp-4"
            }`}
          >
            {content}
          </p>

          {isLong && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-3 inline-flex items-center gap-1.5 rounded text-sm font-medium text-[#e9b44c] hover:text-[#f3c872] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e9b44c]/60"
            >
              {expanded ? "Show less" : "Show full passage"}
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  expanded ? "rotate-180" : ""
                }`}
              />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-[#1f2f3c] bg-[#111b24] p-6">
      <div className="flex animate-pulse items-start gap-4 motion-reduce:animate-none">
        <div className="hidden h-9 w-9 rounded-lg bg-[#16222d] sm:block" />
        <div className="flex-1 space-y-3">
          <div className="h-5 w-2/5 rounded bg-[#16222d]" />
          <div className="h-3.5 w-full rounded bg-[#16222d]" />
          <div className="h-3.5 w-11/12 rounded bg-[#16222d]" />
          <div className="h-3.5 w-3/5 rounded bg-[#16222d]" />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [question, setQuestion] = useState("");
  const [agentId, setAgentId] = useState("support-agent");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const agentLabel =
    AGENTS.find((agent) => agent.value === agentId)?.label ?? "Support";

  async function runSearch(q: string, agent: string) {
    if (!q.trim()) return;

    setLoading(true);
    setError("");
    setResults([]);
    setSearched(false);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, agentId: agent }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Search failed.");
      }

      setResults(Array.isArray(data) ? data : []);
      setSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    runSearch(question, agentId);
  }

  function handleSuggestion(suggestion: string) {
    setQuestion(suggestion);
    runSearch(suggestion, agentId);
  }

  function handleAgentChange(value: string) {
    setAgentId(value);
    setResults([]);
    setError("");
    setSearched(false);
    inputRef.current?.focus();
  }

  return (
    <main
      className={`${body.className} min-h-screen bg-[#0b1218] text-[#e8eef3] selection:bg-[#e9b44c]/30`}
    >
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-[#1f2f3c] bg-[#0b1218]/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-5 sm:px-8">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e9b44c]/60"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e9b44c] text-[#1a1405]">
              <Database className="h-[18px] w-[18px]" />
            </span>
            <span className="text-[15px] font-semibold tracking-tight">
              Knowledge Base
            </span>
          </Link>

          <nav>
            <Link
              href="/upload"
              className="group inline-flex h-10 items-center gap-2.5 rounded-full bg-[#e9b44c] py-1 pl-1.5 pr-4 text-sm font-semibold text-[#1a1405] shadow-[0_0_0_1px_rgba(233,180,76,0.6),0_8px_24px_-8px_rgba(233,180,76,0.7)] transition-all hover:-translate-y-px hover:bg-[#f3c872] hover:shadow-[0_0_0_1px_rgba(243,200,114,0.8),0_12px_28px_-8px_rgba(233,180,76,0.85)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e9b44c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1218] active:translate-y-0 motion-reduce:transition-none"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1a1405] text-[#e9b44c]">
                <Plus className="h-4 w-4 transition-transform duration-200 group-hover:rotate-90 motion-reduce:transition-none" />
              </span>
              <span className="hidden sm:inline">Add knowledge</span>
              <span className="sm:hidden">Add</span>
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 pb-20 sm:px-8">
        {/* Hero: left aligned, the search field is the focus */}
        <section className="max-w-3xl pb-10 pt-14 sm:pb-12 sm:pt-20">
          <h1
            className={`${display.className} text-4xl font-semibold leading-[1.1] tracking-tight text-[#e8eef3] sm:text-5xl`}
          >
            Ask your documents anything.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-[#8fa1b0] sm:text-lg">
            Type a question in plain language and get the passages that
            answer it, pulled from everything you&apos;ve uploaded.
          </p>

          <form onSubmit={handleSearch} className="mt-9">
            <div className="flex items-center gap-2 rounded-xl border border-[#1f2f3c] bg-[#111b24] p-2 pl-4 shadow-[0_8px_30px_rgba(0,0,0,0.35)] transition-colors focus-within:border-[#e9b44c]/60 focus-within:ring-4 focus-within:ring-[#e9b44c]/10">
              <Search className="h-5 w-5 shrink-0 text-[#5d7080]" />
              <Input
                ref={inputRef}
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="What do you want to know?"
                aria-label="Your question"
                className="h-12 min-w-0 flex-1 border-0 bg-transparent px-1 text-base text-[#e8eef3] shadow-none placeholder:text-[#5d7080] focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <Button
                type="submit"
                disabled={loading || !question.trim()}
                className="h-12 gap-2 rounded-lg bg-[#e9b44c] px-5 font-semibold text-[#1a1405] hover:bg-[#f3c872] focus-visible:ring-[#e9b44c] disabled:bg-[#1f2f3c] disabled:text-[#5d7080] disabled:opacity-100"
              >
                {loading ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4 sm:hidden" />
                )}
                <span className={loading ? "" : "hidden sm:inline"}>
                  {loading ? "Searching" : "Search"}
                </span>
              </Button>
            </div>

            {/* Agent picker: all options visible at once */}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="text-sm text-[#8fa1b0]" id="agent-label">
                Search in
              </span>
              <div
                role="radiogroup"
                aria-labelledby="agent-label"
                className="inline-flex rounded-lg border border-[#1f2f3c] bg-[#111b24] p-1"
              >
                {AGENTS.map((agent) => {
                  const active = agent.value === agentId;
                  return (
                    <button
                      key={agent.value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => handleAgentChange(agent.value)}
                      className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e9b44c]/60 ${
                        active
                          ? "bg-[#e9b44c] text-[#1a1405]"
                          : "text-[#8fa1b0] hover:text-[#e8eef3]"
                      }`}
                    >
                      {agent.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </form>

          <div className="mt-6 flex flex-wrap gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleSuggestion(suggestion)}
                disabled={loading}
                className="rounded-full border border-[#1f2f3c] px-3.5 py-1.5 text-sm text-[#8fa1b0] transition-colors hover:border-[#e9b44c]/40 hover:text-[#e8eef3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e9b44c]/60 disabled:opacity-50"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </section>

        {/* Results */}
        <section className="max-w-3xl" aria-live="polite">
          {(loading || searched) && !error && (
            <div className="mb-4 flex items-baseline justify-between gap-4">
              <h2 className="text-sm font-semibold text-[#e8eef3]">
                {loading
                  ? `Searching ${agentLabel} knowledge`
                  : `${results.length} ${
                      results.length === 1 ? "passage" : "passages"
                    } from ${agentLabel}`}
              </h2>
              {!loading && results.length > 0 && (
                <p className="text-sm text-[#5d7080]">Best match first</p>
              )}
            </div>
          )}

          {loading && (
            <div className="space-y-3">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl border border-red-400/25 bg-red-400/[0.07] p-5"
            >
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-300" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-red-200">Search didn&apos;t go through</p>
                <p className="mt-1 break-words text-sm text-red-300/90">
                  {error}
                </p>
                <button
                  type="button"
                  onClick={() => runSearch(question, agentId)}
                  className="mt-3 text-sm font-medium text-red-200 underline underline-offset-4 hover:text-white"
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          {!loading && !error && results.length > 0 && (
            <div className="space-y-3">
              {results.map((result) => (
                <ResultCard key={result.id} result={result} />
              ))}
            </div>
          )}

          {!loading && !error && searched && results.length === 0 && (
            <div className="rounded-xl border border-dashed border-[#2c4152] px-6 py-14 text-center">
              <Database className="mx-auto h-7 w-7 text-[#5d7080]" />
              <h3
                className={`${display.className} mt-4 text-lg font-semibold`}
              >
                Nothing found for {agentLabel}
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#8fa1b0]">
                Try rewording your question, switch to another team above, or
                add documents this team can search.
              </p>
              <div className="mt-6 flex justify-center">
                <Link
                  href="/upload"
                  className="group inline-flex h-10 items-center gap-2.5 rounded-full bg-[#e9b44c] py-1 pl-1.5 pr-4 text-sm font-semibold text-[#1a1405] transition-colors hover:bg-[#f3c872] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e9b44c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1218]"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1a1405] text-[#e9b44c]">
                    <Plus className="h-4 w-4" />
                  </span>
                  Add knowledge
                </Link>
              </div>
            </div>
          )}

          {!loading && !error && !searched && (
            <Link
              href="/upload"
              className="group flex items-center justify-between gap-4 rounded-xl border border-dashed border-[#2c4152] px-5 py-5 transition-colors hover:border-[#e9b44c]/50 hover:bg-[#111b24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e9b44c]/60 sm:px-6"
            >
              <div className="flex items-center gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#16222d] text-[#e9b44c]">
                  <Upload className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-medium text-[#e8eef3]">
                    Nothing indexed yet? Add your first document
                  </p>
                  <p className="mt-0.5 text-sm text-[#8fa1b0]">
                    Results show up here as soon as you ask a question.
                  </p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 text-[#5d7080] transition-transform group-hover:translate-x-0.5 group-hover:text-[#e9b44c]" />
            </Link>
          )}
        </section>

        <footer className="mt-20 max-w-3xl border-t border-[#1f2f3c] pt-6 text-sm text-[#5d7080]">
          Built with Next.js and Qdrant Cloud
        </footer>
      </div>
    </main>
  );
}