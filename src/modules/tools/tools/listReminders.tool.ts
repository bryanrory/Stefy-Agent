import { Tool, ToolContext } from "../tool.types";
import { listReminders } from "../../reminders/reminder.service";

export const listRemindersTool: Tool = {
  name: "list_reminders",
  description: "List all reminders for the current user",
  inputSchema: {},

  async execute(_input: any, context?: ToolContext) {
    const reminders = await listReminders(context?.userId);

    return reminders;
  },
};
