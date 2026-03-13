import { Tool } from "../tool.types";
import { listReminders } from "../../reminders/reminder.service";

export const listRemindersTool: Tool = {
  name: "list_reminders",
  description: "List all reminders",

  async execute() {
    const reminders = await listReminders();

    return reminders;
  },
};
