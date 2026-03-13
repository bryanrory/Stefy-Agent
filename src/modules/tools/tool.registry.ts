import { Tool } from "./tool.types";
import { sendWhatsappTool } from "./tools/sendWhatsapp.tool";
import { createReminderTool } from "./tools/createReminder.tool";
import { listRemindersTool } from "./tools/listReminders.tool";
import { deleteReminderTool } from "./tools/deleteReminder.tool";
import {
  createListTool,
  addItemTool,
  listItemsTool,
  removeItemTool,
  markDoneTool,
} from "../lists/list.tools";
const tools: Tool[] = [
  sendWhatsappTool,
  createReminderTool,
  listRemindersTool,
  deleteReminderTool,
  createListTool,
  addItemTool,
  listItemsTool,
  removeItemTool,
  markDoneTool,
];

export function registerTool(tool: Tool): void {
  const existing = tools.findIndex((t) => t.name === tool.name);
  if (existing !== -1) {
    tools[existing] = tool;
  } else {
    tools.push(tool);
  }
}

export function getTools(): Tool[] {
  return tools;
}

export function getToolByName(name: string): Tool | undefined {
  return tools.find((tool) => tool.name === name);
}

export function buildToolDescriptions(): string {
  return getTools()
    .map((tool) => {
      const schema = tool.inputSchema;
      let inputExample = "{}";

      if (schema && Object.keys(schema).length > 0) {
        const example: Record<string, any> = {};
        for (const [key, def] of Object.entries(schema)) {
          example[key] = def.example ?? `<${def.type}>`;
        }
        inputExample = JSON.stringify(example);
      }

      return `- ${tool.name}: ${tool.description}\n  Input: ${inputExample}`;
    })
    .join("\n\n");
}
