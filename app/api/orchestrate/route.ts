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

interface AgentResult {
  agent: AgentKey;
  name: string;
  role: string;
  response: string;
  isCMO: boolean;
  isOrchestrator: boolean;
}

function cleanResponse(text: string): string {
  // Strip any leading routing/handoff narration before the actual analysis
  text = text.replace(
    /^[\s\S]*?(Routing[\s\S]*?(?:Analysis|Diagnosis|Finding|Recommendation|Executive Summary|##))/i,
    "$1"
  );

  // Strip trailing routing/handoff language
  text = text.replace(
    /\n+(?:Summary for Orche\w+|End of Specialist Chain|Next Step|Routing to|Handoff to|If you wish|For completeness|I will now simulate|The following functions|There are no further)[\s\S]*$/i,
    ""
  );

  return text.trim();
}

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ ok: false, error: "OPENAI_API_KEY is missing" }, { status: 500 });
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const { userRequest, businessContext } = await req.json() as {
    userRequest: string;
    businessContext?: string;
  };

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

  for (const agentKey of chain) {
    const meta = AGENTS[agentKey];
    const systemPrompt = AGENT_PROMPTS[agentKey];

    // Each agent gets a clean call: original request + structured prior findings injected into instructions
    const priorFindings = agentResults.length > 0
      ? `\n\n---\nPRIOR SPECIALIST FINDINGS (for context only — do not re-analyze, do not route):\n${agentResults.map((r) => `=== ${r.name} ===\n${r.response}`).join("\n\n")}`
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

  // The last CMO response is the final synthesis
  const finalCMO = [...agentResults].reverse().find((r) => r.isCMO);
  const specialistResults = agentResults.filter((r) => !r.isCMO && !r.isOrchestrator);

  return NextResponse.json({
    ok: true,
    flowKey,
    flowName: flow.name,
    flowDescription: flow.description,
    agentResults,
    specialistResults,
    synthesis: finalCMO?.response ?? "",
  });
}
