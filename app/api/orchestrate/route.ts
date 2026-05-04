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
  // Strip bracketed routing headers like [Routing to: CMO GPT — ...]
  text = text.replace(/^\[.*?(?:routing|handoff|next agent|specialist).*?\]\n*/i, "");

  const lines = text.split("\n");
  const cleanedLines: string[] = [];
  let started = false;

  const routingPrefixes = [
    "routing to:",
    "[routing to:",
    "next step:",
    "next steps:",
    "next specialist",
    "handoff to:",
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
    "the cmo and executive team should",
    "this integrated",
    "assign an owner",
    "pilot the recommended",
    "use the executive dashboard to drive",
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

  const agentResults: AgentResult[] = [];

  try {
    for (const agentKey of chain) {
      const meta = AGENTS[agentKey];
      const systemPrompt = AGENT_PROMPTS[agentKey];

      const priorFindings = agentResults.length > 0
        ? `\n\n---\nPRIOR SPECIALIST FINDINGS (read-only context — do not re-analyze, do not route):\n${agentResults.map((r) => `=== ${r.name} ===\n${r.response}`).join("\n\n")}`
        : "";

      const agentResponse = await client.responses.create({
        model: "gpt-4.1",
        temperature: 0.2,
        instructions: systemPrompt + priorFindings,
        input: [{ role: "user", content: fullRequest }],
      });

      const textOutput = agentResponse.output.find(
        (item): item is OpenAI.Responses.ResponseOutputMessage => item.type === "message"
      );

      const responseText =
        textOutput?.content
          .filter((c): c is OpenAI.Responses.ResponseOutputText => c.type === "output_text")
          .map((c) => c.text)
          .join("") ?? "";

      agentResults.push({
        agent: agentKey,
        name: meta.name,
        role: meta.role,
        response: cleanResponse(responseText),
        isCMO: agentKey === "cmo-gpt",
        isOrchestrator: agentKey === "marketing-orchestrator-gpt",
      });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Agent chain failed";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }

  const finalCMO = [...agentResults].reverse().find((r) => r.isCMO);
  const specialistResults = agentResults.filter((r) => !r.isCMO && !r.isOrchestrator);

  // Generate next-step prompts based on the synthesis
  const nextStepResponse = await client.responses.create({
    model: "gpt-4.1",
    temperature: 0.3,
    instructions: `You are a strategic marketing advisor. Based on the CMO executive recommendation provided, generate 3–4 specific, actionable next-step prompts the user could ask to continue the work.

Each prompt should be a ready-to-use question or instruction. Cover a mix of:
- Requesting missing data or research
- Building a specific campaign, workflow, or playbook
- Going deeper on a specific finding
- Requesting a deliverable (e.g. messaging framework, scoring model, dashboard)

Format as a JSON array of strings only. No explanation, no preamble, just the array.
Example: ["Build a 60-day campaign plan targeting spreadsheet users", "What data do we need to validate the ICP hypothesis?"]`,
    input: [{ role: "user", content: `CMO Synthesis:\n${finalCMO?.response ?? ""}\n\nOriginal Request:\n${fullRequest}` }],
  });

  const nextStepText = nextStepResponse.output
    .find((item): item is OpenAI.Responses.ResponseOutputMessage => item.type === "message")
    ?.content
    .filter((c): c is OpenAI.Responses.ResponseOutputText => c.type === "output_text")
    .map((c) => c.text)
    .join("") ?? "[]";

  let nextSteps: string[] = [];
  try {
    const match = nextStepText.match(/\[[\s\S]*\]/);
    nextSteps = match ? JSON.parse(match[0]) : [];
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
