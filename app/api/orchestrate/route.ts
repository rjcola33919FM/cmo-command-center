import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import {
  AGENTS,
  AGENT_PROMPTS,
  FLOWS,
  detectFlow,
  type AgentKey,
  type FlowKey,
} from "@/app/lib/agents";

// Allow up to 300s on Vercel Pro; hobby plan caps at 60s
export const maxDuration = 300;

interface AgentResult {
  agent: AgentKey;
  name: string;
  role: string;
  response: string;
  isCMO: boolean;
  isOrchestrator: boolean;
}

function cleanResponse(text: string): string {
  // Strip ALL bracketed routing/handoff markers anywhere in text
  text = text.replace(/\[.*?(?:routing|handoff|next agent|specialist).*?\]\n?/gi, "");

  const lines = text.split("\n");
  const cleanedLines: string[] = [];
  let started = false;

  const routingPrefixes = [
    "routing to:",
    "routing:",
    "[routing",
    "next specialist",
    "next agent",
    "the next agent",
    "handoff to:",
    "hand-off:",
    "hand-off to:",
    "next, the",
    "end of specialist chain",
    "summary for orchestr",
    "if you wish",
    "for completeness",
    "i will now simulate",
    "the following functions have",
    "there are no further",
    "with the addition of",
    "with the core",
    "all core marketing",
    "immediate executive action required",
    "this plan is designed for rapid execution",
    "if you require vendor",
    "prepared for board",
    "board-ready synthesis",
  ];

  for (const line of lines) {
    const lower = line.toLowerCase().trim();

    // Skip leading blank lines and routing preamble before analysis starts
    if (!started) {
      if (routingPrefixes.some((p) => lower.startsWith(p))) continue;
      if (lower === "") continue;
      started = true;
    }

    // Stop at trailing routing/summary sections
    if (routingPrefixes.some((p) => lower.startsWith(p))) break;

    cleanedLines.push(line);
  }

  return cleanedLines.join("\n").trim();
}

// Strip hallucinated specialist agent blocks from CMO synthesis output
function cleanSynthesis(text: string): string {
  const VALID_HEADINGS = new Set([
    "executive summary",
    "root-cause diagnosis",
    "key findings",
    "recommended action plan",
    "30/60/90-day execution plan",
    "metrics to track",
    "risks and assumptions",
  ]);

  // Remove inline routing brackets anywhere in synthesis
  text = text.replace(/\[.*?(?:routing|handoff|next agent|specialist).*?\]\n?/gi, "");

  const lines = text.split("\n");
  const output: string[] = [];
  let skipping = false;

  for (const line of lines) {
    const trimmed = line.trim();
    const lower = trimmed.toLowerCase();

    // Detect hallucinated specialist/agent section headers:
    // "=== XYZ GPT ===" or heading containing "gpt"/"specialist" not in valid set
    const headingText = lower.replace(/^#+\s*/, "").replace(/[*_]/g, "").trim();
    const isHallucinatedHeader =
      /^={2,}.*\b(gpt|specialist)\b.*={2,}$/i.test(trimmed) ||
      (/^#{1,4}\s+/.test(trimmed) &&
        /\b(gpt|specialist)\b/i.test(trimmed) &&
        !VALID_HEADINGS.has(headingText));

    if (isHallucinatedHeader) {
      skipping = true;
      continue;
    }

    if (skipping) {
      // Resume at the next valid CMO heading
      if (/^#{1,3}\s+/.test(trimmed) && VALID_HEADINGS.has(headingText)) {
        skipping = false;
        output.push(line);
      }
      continue;
    }

    output.push(line);
  }

  return output.join("\n").trim();
}

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ ok: false, error: "OPENAI_API_KEY is missing" }, { status: 500 });
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  let body: { userRequest?: string; businessContext?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body" }, { status: 400 });
  }

  const { userRequest, businessContext } = body;

  if (!userRequest?.trim()) {
    return NextResponse.json({ ok: false, error: "No request provided" }, { status: 400 });
  }

  const flowKey: FlowKey = detectFlow(userRequest);
  const flow = FLOWS[flowKey];
  const chain = flow.chain;

  const fullRequest = businessContext
    ? `Business Context:\n${businessContext}\n\nMarketing Problem / Request:\n${userRequest}`
    : userRequest;

  // Split chain into: [opening CMO] + [specialists] + [orchestrator] + [final CMO]
  const openingCMO = chain[0]; // always cmo-gpt
  const finalCMOKey = chain[chain.length - 1]; // always cmo-gpt
  const orchestratorKey = chain[chain.length - 2]; // always marketing-orchestrator-gpt
  const specialistKeys = chain.slice(1, chain.length - 2); // everything in between

  async function callAgent(agentKey: AgentKey, instructions: string): Promise<AgentResult> {
    const meta = AGENTS[agentKey];
    const res = await client.responses.create({
      model: "gpt-4.1",
      temperature: 0.2,
      instructions,
      input: [{ role: "user", content: fullRequest }],
    });
    const text = res.output
      .find((i): i is OpenAI.Responses.ResponseOutputMessage => i.type === "message")
      ?.content
      .filter((c): c is OpenAI.Responses.ResponseOutputText => c.type === "output_text")
      .map((c) => c.text)
      .join("") ?? "";
    return {
      agent: agentKey,
      name: meta.name,
      role: meta.role,
      response: cleanResponse(text),
      isCMO: agentKey === "cmo-gpt",
      isOrchestrator: agentKey === "marketing-orchestrator-gpt",
    };
  }

  let agentResults: AgentResult[] = [];

  try {
    // Step 1: Opening CMO frame (sequential — sets context)
    const openingResult = await callAgent(openingCMO, AGENT_PROMPTS[openingCMO]);
    agentResults.push(openingResult);

    // Step 2: All specialists in parallel — major speed improvement
    const specialistResults = await Promise.all(
      specialistKeys.map((key) => callAgent(key, AGENT_PROMPTS[key]))
    );
    agentResults.push(...specialistResults);

    // Step 3: Orchestrator synthesizes all specialist findings
    const allFindings = agentResults
      .map((r) => `=== ${r.name} ===\n${r.response}`)
      .join("\n\n");
    const orchestratorInstructions = AGENT_PROMPTS[orchestratorKey] +
      `\n\n---\nSPECIALIST FINDINGS TO SYNTHESIZE:\n${allFindings}`;
    const orchestratorResult = await callAgent(orchestratorKey, orchestratorInstructions);
    agentResults.push(orchestratorResult);

    // Step 4: Final CMO synthesis — locked prompt only
    const finalCMOInstructions = `You are the CMO GPT producing the FINAL board-ready executive recommendation.

CRITICAL CONSTRAINTS — violating any of these will break the system:
- You are the CMO. You are NOT a specialist agent of any kind.
- Do NOT invent, simulate, or roleplay as any agent that is not you.
- Do NOT create sections named after any GPT, Agent, or Specialist (e.g., do NOT write "Data Governance GPT" or "Sales Enablement Specialist" — those do not exist).
- The specialists have ALREADY responded. Their findings are given to you below. Do not add new specialist perspectives.
- Do NOT include any routing language, handoff notes, or agent labels.
- You MUST use EXACTLY these 7 section headings and no others:

## Executive Summary
## Root-Cause Diagnosis
## Key Findings
## Recommended Action Plan
## 30/60/90-Day Execution Plan
## Metrics to Track
## Risks and Assumptions

Begin with "## Executive Summary". End after "## Risks and Assumptions". Nothing before, nothing after.

---
SPECIALIST FINDINGS (already collected — do not add more):
${allFindings}

ORCHESTRATOR SYNTHESIS:
${orchestratorResult.response}`;

    const rawFinalCMOResult = await callAgent(finalCMOKey, finalCMOInstructions);
    const finalCMOResult = {
      ...rawFinalCMOResult,
      response: cleanSynthesis(rawFinalCMOResult.response),
    };
    agentResults.push(finalCMOResult);

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Agent chain failed";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }

  const finalCMO = [...agentResults].reverse().find((r) => r.isCMO);
  const specialistResults = agentResults.filter((r) => !r.isCMO && !r.isOrchestrator);

  // Generate next-step prompts based on the synthesis
  let nextSteps: string[] = [];
  try {
    const nextStepResponse = await client.responses.create({
      model: "gpt-4.1",
      temperature: 0.3,
      instructions: `You are a strategic marketing advisor. Based on the CMO recommendation and original request, generate exactly 4 specific follow-up prompts the user could submit next.

Cover a mix of: requesting missing data, building a campaign or playbook, going deeper on a finding, or requesting a specific deliverable.

Output ONLY 4 lines. Each line must start with "- " followed by the prompt. No numbering, no headers, no explanation.

Example output:
- Build a 6-week Meta ad campaign plan targeting emergency HVAC repair leads in Dallas
- What lead response automation workflow should we set up in HubSpot before peak season?
- Create a weekly dashboard template to track cost per booked job by channel
- What questions should we add to our lead form to improve intent scoring?`,
      input: [{ role: "user", content: `Original Request:\n${fullRequest}\n\nCMO Recommendation:\n${finalCMO?.response ?? ""}` }],
    });

    const nextStepText = nextStepResponse.output
      .find((item): item is OpenAI.Responses.ResponseOutputMessage => item.type === "message")
      ?.content
      .filter((c): c is OpenAI.Responses.ResponseOutputText => c.type === "output_text")
      .map((c) => c.text)
      .join("") ?? "";

    nextSteps = nextStepText
      .split("\n")
      .map((l) => l.replace(/^[-*•]\s*/, "").trim())
      .filter((l) => l.length > 10);
  } catch {
    nextSteps = [];
  }

  return NextResponse.json({
    ok: true,
    flowKey,
    flowName: flow.name,
    flowDescription: flow.description,
    agentResults,
    specialistResults,
    synthesis: finalCMO?.response ?? "",
    nextSteps,
  });
}
