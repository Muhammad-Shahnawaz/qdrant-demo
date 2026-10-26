
"use client";

import { DragEvent, FormEvent, useRef, useState } from "react";
import Link from "next/link";
import { Fraunces, Figtree } from "next/font/google";
import {
  Database,
  ArrowLeft,
  ArrowRight,
  UploadCloud,
  FileText,
  X,
  LoaderCircle,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

const display = Fraunces({ subsets: ["latin"], weight: ["400", "600"] });
const body = Figtree({ subsets: ["latin"] });

const MAX_BYTES = 2 * 1024 * 1024;

const AGENTS = [
  { value: "support-agent", label: "Support" },
  { value: "sales-agent", label: "Sales" },
  { value: "knowledge-agent", label: "Knowledge Base" },
];

type UploadResult = {
  success?: boolean;
  message?: string;
  fileName?: string;
  agentId?: string;
  chunksUploaded?: number;
  documentId?: string;
  error?: string;
};

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getAgentLabel(agentId?: string) {
  return AGENTS.find((agent) => agent.value === agentId)?.label || agentId || "Unknown";
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [agentId, setAgentId] = useState("support-agent");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function chooseFile(next: File | null) {
    setResult(null);

    if (!next) {
      setFile(null);
      setError("");
      return;
    }

    const isText =
      next.name.toLowerCase().endsWith(".txt") || next.type === "text/plain";

    if (!isText) {
      setFile(null);
      setError("That file type isn't supported. Choose a .txt file.");
      return;
    }

    if (next.size > MAX_BYTES) {
      setFile(null);
      setError(
        `That file is ${formatSize(next.size)}. The limit is 2 MB, so try a smaller one.`
      );
      return;
    }

    setError("");
    setFile(next);
  }

  function clearFile() {
    setFile(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    chooseFile(event.dataTransfer.files?.[0] || null);
  }

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setError("Choose a .txt file first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("agentId", agentId);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data: UploadResult = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed.");
      }

      setResult({ ...data, agentId });
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className={`${body.className} min-h-screen bg-[#0b1218] text-[#e8eef3] selection:bg-[#e9b44c]/30`}
    >
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
              href="/"
              className="inline-flex h-10 items-center gap-2 rounded-full border border-[#1f2f3c] px-4 text-sm font-medium text-[#8fa1b0] transition-colors hover:border-[#2c4152] hover:bg-[#111b24] hover:text-[#e8eef3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e9b44c]/60"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to search
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 pb-20 sm:px-8">
        <section className="max-w-2xl pb-16 pt-14 sm:pt-20">
          <h1
            className={`${display.className} text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl`}
          >
            Add knowledge
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-[#8fa1b0] sm:text-lg">
            Upload a text document and assign it to an agent. Each agent searches
            only the documents assigned to it.
          </p>

          {!result && (
            <form onSubmit={handleUpload} className="mt-9 space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="agent"
                  className="block text-sm font-medium text-[#e8eef3]"
                >
                  Assign document to
                </label>
                <select
                  id="agent"
                  value={agentId}
                  onChange={(event) => setAgentId(event.target.value)}
                  disabled={loading}
                  className="h-12 w-full rounded-xl border border-[#2c4152] bg-[#111b24] px-4 text-sm text-[#e8eef3] outline-none transition-colors focus:border-[#e9b44c]/60 focus:ring-4 focus:ring-[#e9b44c]/10 disabled:opacity-50"
                >
                  {AGENTS.map((agent) => (
                    <option key={agent.value} value={agent.value}>
                      {agent.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs leading-5 text-[#5d7080]">
                  Choose which agent should be able to retrieve this document.
                </p>
              </div>

              {!file && (
                <label
                  htmlFor="document-file"
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  className={`group flex cursor-pointer flex-col items-center rounded-xl border border-dashed px-6 py-14 text-center transition-colors focus-within:border-[#e9b44c]/60 focus-within:ring-4 focus-within:ring-[#e9b44c]/10 ${
                    dragging
                      ? "border-[#e9b44c] bg-[#e9b44c]/[0.06]"
                      : "border-[#2c4152] bg-[#111b24] hover:border-[#e9b44c]/50"
                  }`}
                >
                  <span
                    className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${
                      dragging
                        ? "bg-[#e9b44c] text-[#1a1405]"
                        : "bg-[#16222d] text-[#e9b44c]"
                    }`}
                  >
                    <UploadCloud className="h-6 w-6" />
                  </span>
                  <span className="mt-4 font-medium text-[#e8eef3]">
                    {dragging ? "Drop to select" : "Drop a .txt file here"}
                  </span>
                  <span className="mt-1 text-sm text-[#8fa1b0]">
                    or{" "}
                    <span className="font-medium text-[#e9b44c] underline underline-offset-4">
                      browse your computer
                    </span>
                  </span>
                  <span className="mt-4 text-xs text-[#5d7080]">
                    Plain text only, up to 2 MB
                  </span>
                  <input
                    ref={inputRef}
                    id="document-file"
                    type="file"
                    accept=".txt,text/plain"
                    onChange={(event) =>
                      chooseFile(event.target.files?.[0] || null)
                    }
                    className="sr-only"
                  />
                </label>
              )}

              {file && (
                <div className="flex items-center gap-4 rounded-xl border border-[#1f2f3c] bg-[#111b24] p-4 sm:p-5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#16222d] text-[#e9b44c]">
                    <FileText className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-[#e8eef3]">
                      {file.name}
                    </p>
                    <p className="mt-0.5 text-sm text-[#8fa1b0]">
                      {formatSize(file.size)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={clearFile}
                    disabled={loading}
                    aria-label="Remove selected file"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#8fa1b0] transition-colors hover:bg-[#16222d] hover:text-[#e8eef3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e9b44c]/60 disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-3 rounded-xl border border-red-400/25 bg-red-400/[0.07] p-4"
                >
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-300" />
                  <p className="min-w-0 break-words text-sm leading-6 text-red-200">
                    {error}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !file}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#e9b44c] px-5 font-semibold text-[#1a1405] transition-colors hover:bg-[#f3c872] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e9b44c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1218] disabled:cursor-not-allowed disabled:bg-[#1f2f3c] disabled:text-[#5d7080]"
              >
                {loading ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin motion-reduce:animate-none" />
                    Uploading and indexing
                  </>
                ) : (
                  "Upload document"
                )}
              </button>

              <p className="text-sm leading-6 text-[#5d7080]">
                Once indexed, the document will be searchable by the selected
                agent on the main page.
              </p>
            </form>
          )}

          {result && (
            <div className="mt-9 rounded-xl border border-[#1f2f3c] bg-[#111b24] p-6 sm:p-7">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-400" />
                <div className="min-w-0">
                  <h2 className={`${display.className} text-xl font-semibold`}>
                    {result.message || "Document added"}
                  </h2>
                  <p className="mt-1 text-sm text-[#8fa1b0]">
                    It&apos;s ready to search.
                  </p>
                </div>
              </div>

              <dl className="mt-6 divide-y divide-[#1f2f3c] rounded-lg border border-[#1f2f3c] bg-[#0b1218] text-sm">
                <div className="flex items-baseline justify-between gap-4 px-4 py-3">
                  <dt className="text-[#8fa1b0]">File</dt>
                  <dd className="min-w-0 break-all text-right font-medium text-[#e8eef3]">
                    {result.fileName}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 px-4 py-3">
                  <dt className="text-[#8fa1b0]">Assigned agent</dt>
                  <dd className="font-medium text-[#e8eef3]">
                    {getAgentLabel(result.agentId)}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 px-4 py-3">
                  <dt className="text-[#8fa1b0]">Passages stored</dt>
                  <dd className="font-medium tabular-nums text-[#e8eef3]">
                    {result.chunksUploaded}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 px-4 py-3">
                  <dt className="text-[#8fa1b0]">Document ID</dt>
                  <dd className="min-w-0 break-all text-right font-mono text-xs text-[#8fa1b0]">
                    {result.documentId}
                  </dd>
                </div>
              </dl>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/"
                  className="group inline-flex h-11 items-center gap-2 rounded-full bg-[#e9b44c] px-5 text-sm font-semibold text-[#1a1405] transition-colors hover:bg-[#f3c872] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e9b44c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111b24]"
                >
                  Search your documents
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
                </Link>
                <button
                  type="button"
                  onClick={() => setResult(null)}
                  className="inline-flex h-11 items-center rounded-full border border-[#2c4152] px-5 text-sm font-medium text-[#e8eef3] transition-colors hover:bg-[#16222d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e9b44c]/60"
                >
                  Upload another
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
