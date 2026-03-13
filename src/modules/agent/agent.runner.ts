import Anthropic from "@anthropic-ai/sdk";
import { env } from "../../config/env";
import { logger } from "../../config/logger";
import { executeTool } from "../tools/tool.executor";
import { buildSystemPrompt } from "./agent.prompt";
import { AgentDecision, AgentResult } from "./agent.types";

const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

export async function runAgent(message: string): Promise<AgentResult> {
  logger.info({ message }, "Agent input");

  const systemPrompt = buildSystemPrompt();

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: "user", content: message }],
  });

  const raw = response.content[0];

  if (raw.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  logger.info({ response: raw.text }, "Claude response");

  const decision: AgentDecision = JSON.parse(raw.text);

  if (decision.type === "tool") {
    logger.info({ tool: decision.tool, input: decision.input }, "Agent calling tool");

    const toolResult = await executeTool(decision.tool, decision.input);

    return { decision, result: toolResult };
  }

  return { decision, result: decision.text };
}
