"use client";

import { useState, type ComponentPropsWithoutRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { AGENTS, FLOWS, type AgentKey, type FlowKey } from "@/app/lib/agents";

// ─── Markdown Renderer ───────────────────────────────────────────────────────

const mdComponents = {
  h1: (p: ComponentPropsWithoutRef<"h1">) => <h1 className="text-xl font-bold mt-4 mb-2 text-white" {...p} />,
  h2: (p: ComponentPropsWithoutRef<"h2">) => <h2 className="text-lg font-bold mt-4 mb-2 text-white/90" {...p} />,
  h3: (p: ComponentPropsWithoutRef<"h3">) => <h3 className="text-base font-semibold mt-3 mb-1 text-white/80" {...p} />,
  p: (p: ComponentPropsWithoutRef<"p">) => <p className="text-base text-white/70 my-2 leading-relaxed" {...p} />,
  ul: (p: ComponentPropsWithoutRef<"ul">) => <ul className="list-disc pl-5 my-2 text-base text-white/70 space-y-1" {...p} />,
  ol: (p: ComponentPropsWithoutRef<"ol">) => <ol className="list-decimal pl-5 my-2 text-base text-white/70 space-y-1" {...p} />,
  li: (p: ComponentPropsWithoutRef<"li">) => <li className="leading-relaxed" {...p} />,
  strong: (p: ComponentPropsWithoutRef<"strong">) => <strong className="font-semibold text-white" {...p} />,
  em: (p: ComponentPropsWithoutRef<"em">) => <em className="italic text-white/60" {...p} />,
  a: (p: ComponentPropsWithoutRef<"a">) => <a className="text-blue-400 underline" target="_blank" rel="noreferrer" {...p} />,
  blockquote: (p: ComponentPropsWithoutRef<"blockquote">) => <blockquote className="border-l-4 border-white/20 pl-4 my-3 text-white/50 italic" {...p} />,
  hr: () => <hr className="my-4 border-white/10" />,
  table: (p: ComponentPropsWithoutRef<"table">) => (
    <div className="overflow-x-auto my-3">
      <table className="min-w-full border-collapse text-sm" {...p} />
    </div>
  ),
  th: (p: ComponentPropsWithoutRef<"th">) => <th className="border border-white/20 bg-white/5 px-3 py-2 text-left font-semibold text-white/80" {...p} />,
  td: (p: ComponentPropsWithoutRef<"td">) => <td className="border border-white/10 px-3 py-2 text-white/60" {...p} />,
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
    executive_strategy: "#3b82f6",
    campaign_performance: "#f97316",
    crm_lifecycle: "#f43f5e",
    customer_insight: "#ec4899",
    competitive_positioning: "#6366f1",
    launch_or_gtm: "#14b8a6",
    dashboard_reporting: "#06b6d4",
  };
  const color = colors[flowKey] ?? "#6366f1";
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full"
      style={{ background: `${color}22`, color, border: `1px solid ${color}55` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {flowName}
    </span>
  );
}

// ─── Agent Card ──────────────────────────────────────────────────────────────

function AgentCard({ result, index, total }: { result: AgentResult; index: number; total: number }) {
  // Specialist agents open by default; CMO and orchestrator collapsed
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
          <div className="w-px flex-1 mt-1 min-h-4" style={{ background: `${meta.border}44` }} />
        )}
      </div>

      <div
        className="flex-1 rounded-xl overflow-hidden border mb-3"
        style={{ borderColor: `${meta.border}55` }}
      >
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between px-4 py-3 text-left"
          style={{ background: `${meta.color}cc` }}
        >
          <div>
            <div className="font-semibold text-sm text-white">{result.name}</div>
            <div className="text-xs mt-0.5" style={{ color: meta.border }}>{result.role}</div>
          </div>
          <span className="text-white/40 text-lg ml-4">{open ? "−" : "+"}</span>
        </button>
        {open && (
          <div className="p-4" style={{ background: "#0d1117" }}>
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
    <div className="rounded-2xl overflow-hidden border" style={{ borderColor: "#3b82f655" }}>
      <div className="px-5 py-3 flex items-center gap-3" style={{ background: "#1e3a5f" }}>
        <div className="w-2 h-2 rounded-full bg-blue-400" />
        <span className="font-semibold text-white text-sm">CMO Executive Synthesis</span>
        <span className="text-white/30 text-xs ml-auto">Final Board-Ready Recommendation</span>
      </div>
      <div className="p-6" style={{ background: "#0d1117" }}>
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
    <main className="min-h-screen" style={{ background: "#080c14", color: "#fff" }}>
      {/* Header */}
      <div
        className="border-b px-6 py-4 flex items-center justify-between"
        style={{ borderColor: "#ffffff0f", background: "#0d1117" }}
      >
        <div>
          <span className="font-bold text-white text-lg tracking-tight">CMO Command Center</span>
          <span
            className="ml-3 text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: "#6366f122", color: "#818cf8", border: "1px solid #6366f133" }}
          >
            10 Specialist Agents
          </span>
        </div>
        <div className="hidden md:flex items-center gap-2 flex-wrap">
          {(Object.entries(AGENTS) as [AgentKey, typeof AGENTS[AgentKey]][]).slice(0, 6).map(([key, meta]) => (
            <span
              key={key}
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: `${meta.border}15`, color: meta.border, border: `1px solid ${meta.border}33` }}
            >
              {meta.name.replace(" GPT", "")}
            </span>
          ))}
          <span className="text-xs text-white/30">+4 more</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Input Panel */}
        <form onSubmit={handleSubmit}>
          <div
            className="rounded-2xl border p-6 mb-6"
            style={{ background: "#0d1117", borderColor: "#ffffff0f" }}
          >
            <div className="mb-4">
              <label className="block text-sm font-semibold text-white/70 mb-2">
                Marketing Problem or Question
              </label>
              <textarea
                value={userRequest}
                onChange={(e) => setUserRequest(e.target.value)}
                placeholder="e.g. Our campaign performance has dropped 30% in 60 days. CAC is up, conversion rates are down. What's wrong and what should we do?"
                rows={4}
                className="w-full rounded-xl px-4 py-3 text-base text-white placeholder-white/20 focus:outline-none resize-y"
                style={{ background: "#161b27", border: "1px solid #ffffff15" }}
              />
            </div>

            <button
              type="button"
              onClick={() => setShowContext(!showContext)}
              className="text-xs text-white/40 hover:text-white/60 transition-colors mb-4 flex items-center gap-1"
            >
              {showContext ? "▾" : "▸"} {showContext ? "Hide" : "Add"} business context (optional)
            </button>

            {showContext && (
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                {CONTEXT_FIELDS.map((field) => (
                  <div key={field.id}>
                    <label className="block text-xs font-medium text-white/50 mb-1">
                      {field.label}
                    </label>
                    <input
                      type="text"
                      placeholder={field.placeholder}
                      value={contextFields[field.id] ?? ""}
                      onChange={(e) => handleContextChange(field.id, e.target.value)}
                      className="w-full rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none"
                      style={{ background: "#161b27", border: "1px solid #ffffff15" }}
                    />
                  </div>
                ))}
              </div>
            )}

            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

            <div className="flex items-center justify-between gap-4">
              <p className="text-xs text-white/30">
                Agent chain is detected automatically from your request.
              </p>
              <button
                type="submit"
                disabled={loading || !userRequest.trim()}
                className="flex-shrink-0 px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: "#6366f1" }}
              >
                {loading ? "Running Analysis..." : "Run CMO Analysis →"}
              </button>
            </div>
          </div>
        </form>

        {/* Loading */}
        {loading && (
          <div
            className="rounded-2xl border p-10 text-center mb-6"
            style={{ background: "#0d1117", borderColor: "#ffffff0f" }}
          >
            <p className="text-white/40 text-sm">
              Running agent chain — this may take 30–90 seconds depending on the flow...
            </p>
          </div>
        )}

        {/* Results */}
        {result && (
          <>
            {/* Flow Header */}
            <div
              className="rounded-2xl border p-5 mb-6"
              style={{ background: "#0d1117", borderColor: "#ffffff0f" }}
            >
              <div className="flex items-center gap-4 flex-wrap">
                <div>
                  <div className="text-xs text-white/30 mb-1">Detected Flow</div>
                  <FlowBadge flowKey={result.flowKey} flowName={result.flowName} />
                </div>
                <div className="text-white/20 text-xl hidden md:block">→</div>
                <div className="flex flex-wrap gap-2">
                  {result.agentResults.map((r, i) => {
                    const meta = AGENTS[r.agent];
                    return (
                      <span
                        key={`badge-${i}`}
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: `${meta.border}15`, color: meta.border, border: `1px solid ${meta.border}33` }}
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
              <h2 className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-4">
                Agent Pipeline — {result.agentResults.length} agents
              </h2>
              {result.agentResults.map((r, i) => (
                <AgentCard key={`card-${i}`} result={r} index={i} total={result.agentResults.length} />
              ))}
            </div>

            {/* CMO Synthesis */}
            {result.synthesis && (
              <div>
                <h2 className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-4">
                  Final Executive Recommendation
                </h2>
                <SynthesisPanel synthesis={result.synthesis} />
              </div>
            )}

            {/* Next Steps */}
            {result.nextSteps && result.nextSteps.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-4">
                  Suggested Next Steps
                </h2>
                <div
                  className="rounded-2xl border p-6"
                  style={{ background: "#0d1117", borderColor: "#6366f133" }}
                >
                  <p className="text-xs text-white/40 mb-4">
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
                        className="w-full text-left px-4 py-3 rounded-xl border text-base text-white/70 hover:text-white transition-all hover:border-white/20 flex items-start gap-3"
                        style={{ background: "#161b27", borderColor: "#ffffff0f" }}
                      >
                        <span className="flex-shrink-0 mt-0.5 text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: "#6366f122", color: "#818cf8" }}>
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
              <h2 className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-4">
                Clarify, Correct, or Go Deeper
              </h2>
              <form
                onSubmit={handleFollowUp}
                className="rounded-2xl border p-6"
                style={{ background: "#0d1117", borderColor: "#ffffff0f" }}
              >
                <p className="text-xs text-white/40 mb-4">
                  Disagree with a finding? Want to redirect the analysis? Type your follow-up and run a new chain.
                </p>
                <textarea
                  value={followUp}
                  onChange={(e) => setFollowUp(e.target.value)}
                  placeholder="e.g. The recommendation to target window unit owners is incorrect for our business — we only service central air systems. Please revise the campaign strategy accordingly."
                  rows={3}
                  className="w-full rounded-xl px-4 py-3 text-base text-white placeholder-white/20 focus:outline-none resize-y mb-4"
                  style={{ background: "#161b27", border: "1px solid #ffffff15" }}
                />
                <div className="flex items-center justify-between gap-4">
                  <p className="text-xs text-white/20">
                    This will re-run the full agent chain with your updated request.
                  </p>
                  <button
                    type="submit"
                    disabled={!followUp.trim()}
                    className="flex-shrink-0 px-6 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: "#6366f1" }}
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
          <div
            className="rounded-2xl border p-6"
            style={{ background: "#0d1117", borderColor: "#ffffff0f" }}
          >
            <div className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-4">
              Available Flows — click to pre-fill
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {(Object.entries(FLOWS) as [FlowKey, typeof FLOWS[FlowKey]][]).map(([key, flow]) => (
                <div
                  key={key}
                  className="p-3 rounded-xl border cursor-pointer hover:border-white/20 transition-colors"
                  style={{ borderColor: "#ffffff08", background: "#161b27" }}
                  onClick={() => setUserRequest(`[${flow.name}] `)}
                >
                  <FlowBadge flowKey={key} flowName={flow.name} />
                  <p className="text-xs text-white/30 mt-2">{flow.description}</p>
                  <p className="text-xs text-white/20 mt-1">
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
