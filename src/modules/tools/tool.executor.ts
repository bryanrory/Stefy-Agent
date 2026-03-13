import { logger } from "../../config/logger";
import { getToolByName } from "./tool.registry";

export async function executeTool(name: string, input: any): Promise<any> {
  const tool = getToolByName(name);

  if (!tool) {
    throw new Error(`Tool not found: ${name}`);
  }

  logger.info({ tool: name, input }, "Tool called");

  try {
    const result = await tool.execute(input);
    logger.info({ tool: name, result }, "Tool success");
    return result;
  } catch (err) {
    logger.error({ tool: name, err }, "Tool error");
    throw err;
  }
}
