"use client";

import { useState, type ComponentPropsWithoutRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AGENTS, FLOWS, type AgentKey, type FlowKey } from "@/app/lib/agents";

// ─── Markdown Renderer (light theme) ─────────────────────────────────────────

const mdComponents = {
  h1: (p: ComponentPropsWithoutRef<"h1">) => <h1 className="text-2xl font-bold mt-5 mb-3 text-gray-900 tracking-tight" {...p} />,
  h2: (p: ComponentPropsWithoutRef<"h2">) => <h2 className="text-xl font-semibold mt-5 mb-3 text-gray-900 tracking-tight" {...p} />,
  h3: (p: ComponentPropsWithoutRef<"h3">) => <h3 className="text-lg font-semibold mt-4 mb-2 text-gray-800" {...p} />,
  p: (p: ComponentPropsWithoutRef<"p">) => <p className="text-lg text-gray-700 my-2.5 leading-8" {...p} />,
  ul: (p: ComponentPropsWithoutRef<"ul">) => <ul className="list-disc pl-5 my-3 text-lg text-gray-700 space-y-1.5" {...p} />,
  ol: (p: ComponentPropsWithoutRef<"ol">) => <ol className="list-decimal pl-5 my-3 text-lg text-gray-700 space-y-1.5" {...p} />,
  li: (p: ComponentPropsWithoutRef<"li">) => <li className="leading-7" {...p} />,
  strong: (p: ComponentPropsWithoutRef<"strong">) => <strong className="font-semibold text-gray-900" {...p} />,
  em: (p: ComponentPropsWithoutRef<"em">) => <em className="italic text-gray-600" {...p} />,
  a: (p: ComponentPropsWithoutRef<"a">) => <a className="text-indigo-600 underline underline-offset-2 hover:text-indigo-800" target="_blank" rel="noreferrer" {...p} />,
  blockquote: (p: ComponentPropsWithoutRef<"blockquote">) => <blockquote className="border-l-4 border-gray-300 pl-4 my-4 text-gray-500 italic" {...p} />,
  hr: () => <hr className="my-5 border-gray-200" />,
  table: (p: ComponentPropsWithoutRef<"table">) => (
    <div className="overflow-x-auto my-4">
      <table className="min-w-full border-collapse text-base" {...p} />
    </div>
  ),
  th: (p: ComponentPropsWithoutRef<"th">) => <th className="border border-gray-200 bg-gray-50 px-4 py-2.5 text-left font-semibold text-gray-800" {...p} />,
  td: (p: ComponentPropsWithoutRef<"td">) => <td className="border border-gray-200 px-4 py-2.5 text-gray-700" {...p} />,
};

function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
      {children}
    </ReactMarkdown>
  );
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface AgentResult {
  agent: AgentKey;
  name: string;
  role: string;
  response: string;
  isCMO: boolean;
  isOrchestrator: boolean;
}

interface OrchestrateResponse {
  ok: boolean;
  error?: string;
  flowKey: FlowKey;
  flowName: string;
  flowDescription: string;
  agentResults: AgentResult[];
  specialistResults: AgentResult[];
  synthesis: string;
  nextSteps: string[];
}

// ─── Flow Badge ──────────────────────────────────────────────────────────────

function FlowBadge({ flowKey, flowName }: { flowKey: FlowKey; flowName: string }) {
  const colors: Record<FlowKey, string> = {
    executive_strategy: "#2563eb",
    campaign_performance: "#ea580c",
    crm_lifecycle: "#e11d48",
    customer_insight: "#db2777",
    competitive_positioning: "#4f46e5",
    launch_or_gtm: "#0d9488",
    dashboard_reporting: "#0891b2",
  };
  const color = colors[flowKey] ?? "#4f46e5";
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full"
      style={{ background: `${color}12`, color, border: `1px solid ${color}40` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {flowName}
    </span>
  );
}

// ─── Agent Card ──────────────────────────────────────────────────────────────

function AgentCard({ result, index, total }: { result: AgentResult; index: number; total: number }) {
  const [open, setOpen] = useState(!result.isCMO && !result.isOrchestrator);
  const meta = AGENTS[result.agent];

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center flex-shrink-0">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 border-2"
          style={{ background: meta.color, borderColor: meta.border }}
        >
          {index + 1}
        </div>
        {index < total - 1 && (
          <div className="w-px flex-1 mt-1 min-h-4" style={{ background: `${meta.border}55` }} />
        )}
      </div>

      <div
        className="flex-1 rounded-xl overflow-hidden border mb-3"
        style={{ borderColor: `${meta.border}60` }}
      >
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between px-4 py-3 text-left"
          style={{ background: `${meta.color}dd` }}
        >
          <div>
            <div className="font-semibold text-sm text-white">{result.name}</div>
            <div className="text-xs mt-0.5" style={{ color: meta.border }}>{result.role}</div>
          </div>
          <span className="text-white/70 text-lg ml-4">{open ? "−" : "+"}</span>
        </button>
        {open && (
          <div className="p-6 bg-white">
            <Markdown>{result.response}</Markdown>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Synthesis Panel ─────────────────────────────────────────────────────────

function SynthesisPanel({ synthesis }: { synthesis: string }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-blue-200 shadow-sm">
      <div className="px-5 py-4 flex items-center gap-3" style={{ background: "#1e3a5f" }}>
        <div className="w-2 h-2 rounded-full bg-blue-300" />
        <span className="font-semibold text-white text-sm">CMO Executive Synthesis</span>
        <span className="text-white/60 text-xs ml-auto">Final Board-Ready Recommendation</span>
      </div>
      <div className="p-7 bg-white">
        <Markdown>{synthesis}</Markdown>
      </div>
    </div>
  );
}

// ─── Context Fields ──────────────────────────────────────────────────────────

const CONTEXT_FIELDS = [
  { id: "company", label: "Company / Brand", placeholder: "Acme Corp" },
  { id: "industry", label: "Industry", placeholder: "SaaS, E-commerce, B2B Services..." },
  { id: "revenue", label: "Annual Revenue / Stage", placeholder: "$5M ARR, Series A, etc." },
  { id: "audience", label: "Target Audience", placeholder: "SMB owners, enterprise CMOs..." },
  { id: "goal", label: "Primary Business Goal", placeholder: "Grow MRR 30% in 6 months..." },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const [userRequest, setUserRequest] = useState("");
  const [contextFields, setContextFields] = useState<Record<string, string>>({});
  const [showContext, setShowContext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<OrchestrateResponse | null>(null);
  const [followUp, setFollowUp] = useState("");

  function handleContextChange(id: string, value: string) {
    setContextFields((prev) => ({ ...prev, [id]: value }));
  }

  function buildContext(): string {
    return CONTEXT_FIELDS.filter((f) => contextFields[f.id])
      .map((f) => `${f.label}: ${contextFields[f.id]}`)
      .join("\n");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userRequest.trim()) return;
    setError("");
    setResult(null);
    setFollowUp("");
    setLoading(true);
    try {
      const res = await fetch("/api/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userRequest,
          businessContext: buildContext() || undefined,
        }),
      });
      const data: OrchestrateResponse = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Request failed");
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  function handleFollowUp(e: React.FormEvent) {
    e.preventDefault();
    if (!followUp.trim()) return;
    setUserRequest(followUp);
    setFollowUp("");
    setResult(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className="min-h-screen bg-gray-50" style={{ color: "#111" }}>
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between bg-white shadow-sm">
        <div>
          <span className="font-bold text-gray-900 text-lg tracking-tight">CMO Command Center</span>
          <span className="ml-3 text-xs px-2 py-0.5 rounded-full font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
            10 Specialist Agents
          </span>
        </div>
        <div className="hidden md:flex items-center gap-2 flex-wrap">
          {(Object.entries(AGENTS) as [AgentKey, typeof AGENTS[AgentKey]][]).slice(0, 6).map(([key, meta]) => (
            <span
              key={key}
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: `${meta.border}18`, color: meta.border, border: `1px solid ${meta.border}50` }}
            >
              {meta.name.replace(" GPT", "")}
            </span>
          ))}
          <span className="text-xs text-gray-400">+4 more</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Input Panel */}
        <form onSubmit={handleSubmit}>
          <div className="rounded-2xl border border-gray-200 bg-white p-6 mb-6 shadow-sm">
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Marketing Problem or Question
              </label>
              <textarea
                value={userRequest}
                onChange={(e) => setUserRequest(e.target.value)}
                placeholder="e.g. Our campaign performance has dropped 30% in 60 days. CAC is up, conversion rates are down. What's wrong and what should we do?"
                rows={4}
                className="w-full rounded-xl px-4 py-3 text-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-y border border-gray-200 bg-gray-50"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowContext(!showContext)}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors mb-4 flex items-center gap-1"
            >
              {showContext ? "▾" : "▸"} {showContext ? "Hide" : "Add"} business context (optional)
            </button>

            {showContext && (
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                {CONTEXT_FIELDS.map((field) => (
                  <div key={field.id}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      {field.label}
                    </label>
                    <input
                      type="text"
                      placeholder={field.placeholder}
                      value={contextFields[field.id] ?? ""}
                      onChange={(e) => handleContextChange(field.id, e.target.value)}
                      className="w-full rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 border border-gray-200 bg-gray-50"
                    />
                  </div>
                ))}
              </div>
            )}

            {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

            <div className="flex items-center justify-between gap-4">
              <p className="text-xs text-gray-400">
                Agent chain is detected automatically from your request.
              </p>
              <button
                type="submit"
                disabled={loading || !userRequest.trim()}
                className="flex-shrink-0 px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed bg-indigo-600"
              >
                {loading ? "Running Analysis..." : "Run CMO Analysis →"}
              </button>
            </div>
          </div>
        </form>

        {/* Loading */}
        {loading && (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center mb-6 shadow-sm">
            <p className="text-gray-500 text-sm">
              Running agent chain — this may take 30–90 seconds depending on the flow...
            </p>
          </div>
        )}

        {/* Results */}
        {result && (
          <>
            {/* Flow Header */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 mb-6 shadow-sm">
              <div className="flex items-center gap-4 flex-wrap">
                <div>
                  <div className="text-xs text-gray-400 mb-1">Detected Flow</div>
                  <FlowBadge flowKey={result.flowKey} flowName={result.flowName} />
                </div>
                <div className="text-gray-300 text-xl hidden md:block">→</div>
                <div className="flex flex-wrap gap-2">
                  {result.agentResults.map((r, i) => {
                    const meta = AGENTS[r.agent];
                    return (
                      <span
                        key={`badge-${i}`}
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: `${meta.border}15`, color: meta.border, border: `1px solid ${meta.border}40` }}
                      >
                        {r.name}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Agent Pipeline */}
            <div className="mb-8">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
                Agent Pipeline — {result.agentResults.length} agents
              </h2>
              {result.agentResults.map((r, i) => (
                <AgentCard key={`card-${i}`} result={r} index={i} total={result.agentResults.length} />
              ))}
            </div>

            {/* CMO Synthesis */}
            {result.synthesis && (
              <div>
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
                  Final Executive Recommendation
                </h2>
                <SynthesisPanel synthesis={result.synthesis} />
              </div>
            )}

            {/* Next Steps */}
            {result.nextSteps && result.nextSteps.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
                  Suggested Next Steps
                </h2>
                <div className="rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm">
                  <p className="text-sm text-gray-500 mb-4">
                    Click any prompt below to continue the analysis.
                  </p>
                  <div className="space-y-3">
                    {result.nextSteps.map((step, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setUserRequest(step);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="w-full text-left px-4 py-3 rounded-xl border border-gray-200 text-lg text-gray-700 hover:text-gray-900 hover:border-indigo-300 hover:bg-indigo-50 transition-all flex items-start gap-3 bg-gray-50"
                      >
                        <span className="flex-shrink-0 mt-0.5 text-xs font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">
                          {i + 1}
                        </span>
                        {step}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Follow-Up / Clarification Input */}
            <div className="mt-8">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
                Clarify, Correct, or Go Deeper
              </h2>
              <form
                onSubmit={handleFollowUp}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <p className="text-sm text-gray-500 mb-4">
                  Disagree with a finding? Want to redirect the analysis? Type your follow-up and run a new chain.
                </p>
                <textarea
                  value={followUp}
                  onChange={(e) => setFollowUp(e.target.value)}
                  placeholder="e.g. The recommendation to target window unit owners is incorrect for our business — we only service central air systems. Please revise the campaign strategy accordingly."
                  rows={3}
                  className="w-full rounded-xl px-4 py-3 text-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-y mb-4 border border-gray-200 bg-gray-50"
                />
                <div className="flex items-center justify-between gap-4">
                  <p className="text-xs text-gray-400">
                    This will re-run the full agent chain with your updated request.
                  </p>
                  <button
                    type="submit"
                    disabled={!followUp.trim()}
                    className="flex-shrink-0 px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed bg-indigo-600"
                  >
                    Re-run with Clarification →
                  </button>
                </div>
              </form>
            </div>
          </>
        )}

        {/* Flow Reference — shown before first run */}
        {!result && !loading && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
              Available Flows — click to pre-fill
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {(Object.entries(FLOWS) as [FlowKey, typeof FLOWS[FlowKey]][]).map(([key, flow]) => (
                <div
                  key={key}
                  className="p-4 rounded-xl border border-gray-100 cursor-pointer hover:border-indigo-200 hover:bg-indigo-50 transition-colors bg-gray-50"
                  onClick={() => setUserRequest(`[${flow.name}] `)}
                >
                  <FlowBadge flowKey={key} flowName={flow.name} />
                  <p className="text-sm text-gray-600 mt-2">{flow.description}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {flow.chain.length} agents · {flow.chain.map((a) => AGENTS[a].name).join(" → ")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
