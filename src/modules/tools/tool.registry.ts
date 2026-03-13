import { Tool } from "./tool.types";
import { sendWhatsappTool } from "./tools/sendWhatsapp.tool";
import { createReminderTool } from "./tools/createReminder.tool";
import { listRemindersTool } from "./tools/listReminders.tool";
import { deleteReminderTool } from "./tools/deleteReminder.tool";

export const tools: Tool[] = [
  sendWhatsappTool,
  createReminderTool,
  listRemindersTool,
  deleteReminderTool,
];

export function getToolByName(name: string): Tool | undefined {
  return tools.find((tool) => tool.name === name);
}
