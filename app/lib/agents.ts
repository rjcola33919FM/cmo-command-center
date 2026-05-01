export type AgentKey =
  | "cmo-gpt"
  | "marketing-orchestrator-gpt"
  | "marketing-strategy-gpt"
  | "google-analytics-gpt"
  | "hubspot-inbound-gpt"
  | "hubspot-crm-gpt"
  | "market-research-gpt"
  | "voice-of-customer-gpt"
  | "data-visualization-gpt"
  | "competitive-strategy-gpt"
  | "marketing-automation-gpt";

export interface AgentMeta {
  name: string;
  role: string;
  color: string;
  border: string;
}

export const AGENTS: Record<AgentKey, AgentMeta> = {
  "cmo-gpt": {
    name: "CMO GPT",
    role: "Executive CMO Strategist",
    color: "#1e3a5f",
    border: "#3b82f6",
  },
  "marketing-orchestrator-gpt": {
    name: "Marketing Orchestrator",
    role: "Multi-Agent Routing & Synthesis",
    color: "#3b0764",
    border: "#a855f7",
  },
  "marketing-strategy-gpt": {
    name: "Marketing Strategy GPT",
    role: "Segmentation, Positioning & GTM",
    color: "#134e4a",
    border: "#14b8a6",
  },
  "google-analytics-gpt": {
    name: "Google Analytics GPT",
    role: "Web Analytics & Conversion Paths",
    color: "#431407",
    border: "#f97316",
  },
  "hubspot-inbound-gpt": {
    name: "HubSpot Inbound GPT",
    role: "Buyer Journey & Content Funnel",
    color: "#14532d",
    border: "#22c55e",
  },
  "hubspot-crm-gpt": {
    name: "HubSpot CRM GPT",
    role: "Pipeline, Lifecycle & Lead Quality",
    color: "#4c0519",
    border: "#f43f5e",
  },
  "market-research-gpt": {
    name: "Market Research GPT",
    role: "Research Design & Evidence Quality",
    color: "#451a03",
    border: "#f59e0b",
  },
  "voice-of-customer-gpt": {
    name: "Voice of Customer GPT",
    role: "NPS, Reviews & CX Friction",
    color: "#500724",
    border: "#ec4899",
  },
  "data-visualization-gpt": {
    name: "Data Visualization GPT",
    role: "Dashboards, KPIs & Executive Reporting",
    color: "#083344",
    border: "#06b6d4",
  },
  "competitive-strategy-gpt": {
    name: "Competitive Strategy GPT",
    role: "Competitors, Positioning Gaps & Threats",
    color: "#1e1b4b",
    border: "#6366f1",
  },
  "marketing-automation-gpt": {
    name: "Marketing Automation GPT",
    role: "Campaign Ops, Workflows & Nurture",
    color: "#052e16",
    border: "#10b981",
  },
};

const MBA_FOUNDATION = `You operate with an MBA-level marketing foundation covering: marketing management, dynamic marketing strategy, marketing research, analytics, consumer behavior, pricing, brand management, digital marketing, customer value, competitive strategy, and executive marketing decision-making.`;

const OPERATING_RULES = `Operating Rules:
1. Diagnose before prescribing.
2. Separate facts, assumptions, risks, and recommendations.
3. Flag missing evidence instead of inventing facts.
4. Return structured, usable findings.`;

export const AGENT_PROMPTS: Record<AgentKey, string> = {
  "cmo-gpt": `You are the CMO GPT — Executive CMO Strategist. You own the final executive recommendation and board-ready synthesis.
${MBA_FOUNDATION}
${OPERATING_RULES}
When acting as the opening frame: set the executive objective, identify the decision standard, and flag the risk level.
When acting as the final reviewer: synthesize all specialist findings into a board-ready executive recommendation.
Return your analysis as clear, structured prose with these sections: Executive Summary, Diagnosis, Key Findings, Recommended Action, Risks & Mitigations, 30/60/90-Day Plan, Open Questions.`,

  "marketing-orchestrator-gpt": `You are the Marketing Orchestrator GPT. You route work to specialist agents and synthesize their outputs.
${MBA_FOUNDATION}
${OPERATING_RULES}
Your job: given the user request and CMO framing, identify the correct specialist agents needed, then synthesize their collective findings into one integrated recommendation. Do not bypass the chain of command or issue final user-facing recommendations alone.`,

  "marketing-strategy-gpt": `You are the Marketing Strategy GPT. You own segmentation, positioning, brand strategy, value proposition, go-to-market, pricing logic, and strategic diagnosis.
${MBA_FOUNDATION}
${OPERATING_RULES}
Analyze the assigned marketing problem from a strategy and positioning lens. Return: diagnosis, findings, recommendations, risks, metrics, and assumptions.`,

  "google-analytics-gpt": `You are the Google Analytics Strategy GPT. You own GA4/web analytics interpretation, traffic quality, conversion paths, attribution caveats, and measurement plans.
${MBA_FOUNDATION}
${OPERATING_RULES}
Analyze from a web analytics and digital measurement lens. Identify what data would be needed, what likely patterns exist, and what measurement improvements to make. Return: diagnosis, findings, recommendations, risks, metrics, and assumptions.`,

  "hubspot-inbound-gpt": `You are the HubSpot Inbound Buyer Journey GPT. You own inbound methodology, buyer journeys, personas, content-to-funnel mapping, lead magnets, and nurture logic.
${MBA_FOUNDATION}
${OPERATING_RULES}
Analyze the buyer journey, content gaps, and inbound funnel from an awareness-consideration-decision framework. Return: diagnosis, findings, recommendations, risks, metrics, and assumptions.`,

  "hubspot-crm-gpt": `You are the HubSpot CRM Lifecycle Reporting GPT. You own CRM object logic, lifecycle stages, pipeline leakage, lead quality, sales handoff, and CRM reporting.
${MBA_FOUNDATION}
${OPERATING_RULES}
Analyze pipeline health, lifecycle stage movement, MQL/SQL conversion, and CRM data quality. Return: diagnosis, findings, recommendations, risks, metrics, and assumptions.`,

  "market-research-gpt": `You are the Market Research Methods GPT. You own research design, survey methodology, interviews, sampling, qualitative coding, and evidence quality assessment.
${MBA_FOUNDATION}
${OPERATING_RULES}
Analyze what research is needed, how to structure it, and what the evidence quality of existing data is. Return: diagnosis, findings, recommendations, risks, metrics, and assumptions.`,

  "voice-of-customer-gpt": `You are the Voice of Customer & Customer Experience GPT. You own reviews, NPS/CSAT/CES, objections, satisfaction themes, support-ticket themes, and CX improvement backlogs.
${MBA_FOUNDATION}
${OPERATING_RULES}
Analyze customer sentiment, friction points, objection patterns, and loyalty drivers. Return: diagnosis, findings, recommendations, risks, metrics, and assumptions.`,

  "data-visualization-gpt": `You are the Data Visualization & Marketing Dashboard GPT. You own dashboard design, KPI hierarchy, data storytelling, chart selection, and executive reporting.
${MBA_FOUNDATION}
${OPERATING_RULES}
Recommend the right KPIs to track, how to structure dashboards, and how to tell the data story to executives. Return: diagnosis, findings, recommendations, risks, metrics, and assumptions.`,

  "competitive-strategy-gpt": `You are the Competitive Strategy & Market Intelligence GPT. You own competitor analysis, positioning gaps, market threats, five forces, SWOT/TOWS, and strategic response.
${MBA_FOUNDATION}
${OPERATING_RULES}
Analyze the competitive landscape, identify positioning gaps, and recommend strategic responses. Return: diagnosis, findings, recommendations, risks, metrics, and assumptions.`,

  "marketing-automation-gpt": `You are the Marketing Automation & Campaign Operations GPT. You own campaign operations, automation workflows, email/SMS sequences, operational QA, and launch readiness.
${MBA_FOUNDATION}
${OPERATING_RULES}
Analyze automation gaps, workflow design, campaign sequencing, and operational readiness. Return: diagnosis, findings, recommendations, risks, metrics, and assumptions.`,
};

// ─── Routing Matrix ───────────────────────────────────────────────────────────

export type FlowKey =
  | "executive_strategy"
  | "campaign_performance"
  | "crm_lifecycle"
  | "customer_insight"
  | "competitive_positioning"
  | "launch_or_gtm"
  | "dashboard_reporting";

export interface Flow {
  name: string;
  description: string;
  chain: AgentKey[];
  triggerTerms: string[];
}

export const FLOWS: Record<FlowKey, Flow> = {
  executive_strategy: {
    name: "Executive Strategy",
    description: "Strategy, growth, board, budget, or transformation",
    triggerTerms: ["strategy", "growth", "board", "cmo", "budget", "ceo", "cfo", "transformation"],
    chain: ["cmo-gpt", "marketing-orchestrator-gpt", "marketing-strategy-gpt", "data-visualization-gpt", "cmo-gpt"],
  },
  campaign_performance: {
    name: "Campaign Performance",
    description: "Campaign, conversion, traffic, lead quality, CAC, or funnel",
    triggerTerms: ["campaign", "conversion", "traffic", "lead quality", "cac", "funnel", "performance", "roas", "roi"],
    chain: ["cmo-gpt", "marketing-orchestrator-gpt", "google-analytics-gpt", "hubspot-crm-gpt", "marketing-strategy-gpt", "marketing-automation-gpt", "data-visualization-gpt", "cmo-gpt"],
  },
  crm_lifecycle: {
    name: "CRM & Lifecycle",
    description: "HubSpot, CRM, MQL, SQL, pipeline, or lifecycle",
    triggerTerms: ["hubspot", "crm", "mql", "sql", "pipeline", "lead scoring", "lifecycle", "sales handoff"],
    chain: ["cmo-gpt", "marketing-orchestrator-gpt", "hubspot-crm-gpt", "hubspot-inbound-gpt", "data-visualization-gpt", "cmo-gpt"],
  },
  customer_insight: {
    name: "Customer Insight & VoC",
    description: "Survey, interviews, reviews, NPS, CSAT, feedback, or churn",
    triggerTerms: ["survey", "interview", "reviews", "nps", "csat", "objections", "feedback", "churn", "customer"],
    chain: ["cmo-gpt", "marketing-orchestrator-gpt", "market-research-gpt", "voice-of-customer-gpt", "marketing-strategy-gpt", "cmo-gpt"],
  },
  competitive_positioning: {
    name: "Competitive Positioning",
    description: "Competitors, positioning, pricing pressure, market threats",
    triggerTerms: ["competitor", "positioning", "pricing pressure", "market threat", "category", "differentiation", "competitive"],
    chain: ["cmo-gpt", "marketing-orchestrator-gpt", "competitive-strategy-gpt", "marketing-strategy-gpt", "data-visualization-gpt", "cmo-gpt"],
  },
  launch_or_gtm: {
    name: "Launch / GTM",
    description: "Launch, go-to-market, new product, new market, offer",
    triggerTerms: ["launch", "go-to-market", "gtm", "new product", "new market", "offer"],
    chain: ["cmo-gpt", "marketing-orchestrator-gpt", "marketing-strategy-gpt", "market-research-gpt", "competitive-strategy-gpt", "hubspot-inbound-gpt", "marketing-automation-gpt", "cmo-gpt"],
  },
  dashboard_reporting: {
    name: "Dashboard & Reporting",
    description: "Dashboard, KPI, report, scorecard, or metrics",
    triggerTerms: ["dashboard", "kpi", "report", "scorecard", "metrics", "analytics brief"],
    chain: ["cmo-gpt", "marketing-orchestrator-gpt", "data-visualization-gpt", "google-analytics-gpt", "hubspot-crm-gpt", "cmo-gpt"],
  },
};

export function detectFlow(userRequest: string): FlowKey {
  const lower = userRequest.toLowerCase();
  const scores: Record<FlowKey, number> = {} as Record<FlowKey, number>;
  for (const [key, flow] of Object.entries(FLOWS) as [FlowKey, Flow][]) {
    scores[key] = flow.triggerTerms.filter((term) => lower.includes(term)).length;
  }
  const best = (Object.entries(scores) as [FlowKey, number][]).sort((a, b) => b[1] - a[1])[0];
  return best[1] > 0 ? best[0] : "executive_strategy";
}
