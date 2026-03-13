import Anthropic from "@anthropic-ai/sdk";
import { env } from "../../config/env";
import { logger } from "../../config/logger";
import { executeTool } from "../tools/tool.executor";
import { ToolContext } from "../tools/tool.types";
import { buildSystemPrompt } from "./agent.prompt";
import { AgentDecision, AgentResult } from "./agent.types";
import { saveMessage, getRecentMessages } from "./message.model";

const MAX_STEPS = 5;

const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

export async function runAgent(
  message: string,
  userId?: number,
  phone?: string
): Promise<AgentResult> {
  logger.info({ message, userId, phone }, "Agent input");

  const systemPrompt = buildSystemPrompt();

  const context: ToolContext | undefined =
    userId && phone ? { userId, phone } : undefined;

  // Load conversation history for this user
  const messages: Anthropic.MessageParam[] = [];

  if (userId) {
    const history = await getRecentMessages(userId);
    for (const msg of history) {
      messages.push({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      });
    }
  }

  // Add current message
  messages.push({ role: "user", content: message });

  // Save user message
  if (userId) {
    await saveMessage(userId, "user", message);
  }

  let lastDecision: AgentDecision | null = null;

  for (let step = 0; step < MAX_STEPS; step++) {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    const raw = response.content[0];

    if (raw.type !== "text") {
      throw new Error("Unexpected response type from Claude");
    }

    logger.info({ response: raw.text, step }, "Claude response");

    const decision: AgentDecision = JSON.parse(raw.text);
    lastDecision = decision;

    if (decision.type === "text") {
      // Save assistant response
      if (userId) {
        await saveMessage(userId, "assistant", decision.text);
      }
      return { decision, result: decision.text };
    }

    // Execute tool with context
    logger.info({ tool: decision.tool, input: decision.input, step }, "Agent calling tool");

    const toolResult = await executeTool(decision.tool, decision.input, context);

    logger.info({ tool: decision.tool, result: toolResult, step }, "Tool result");

    // Add assistant response and tool result to conversation
    messages.push({ role: "assistant", content: raw.text });
    messages.push({
      role: "user",
      content: `Tool "${decision.tool}" returned: ${JSON.stringify(toolResult)}\n\nContinue. If you need another tool, call it. If you are done, respond with a friendly text summary.`,
    });
  }

  return {
    decision: lastDecision!,
    result: "Desculpe, não consegui completar a tarefa.",
  };
}
