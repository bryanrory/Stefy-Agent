import { Tool, ToolContext } from "../tool.types";
import { removeReminder } from "../../reminders/reminder.service";

export const deleteReminderTool: Tool = {
  name: "delete_reminder",
  description: "Delete a reminder by ID (only your own reminders)",
  inputSchema: {
    id: { type: "number", description: "Reminder ID", required: true, example: 1 },
  },

  async execute(input: { id: number }, context?: ToolContext) {
    const { id } = input;

    if (id === undefined || id === null) {
      throw new Error("Missing required field: id");
    }

    const removed = await removeReminder(Number(id), context?.userId);

    if (!removed) {
      throw new Error(`Reminder with id ${id} not found`);
    }

    return removed;
  },
};
