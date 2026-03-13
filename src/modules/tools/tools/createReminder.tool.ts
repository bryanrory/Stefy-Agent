import { Tool } from "../tool.types";
import { createReminder } from "../../reminders/reminder.service";

export const createReminderTool: Tool = {
  name: "create_reminder",
  description: "Create a new daily reminder",

  async execute(input: { text: string; time: string; target: string }) {
    const { text, time, target } = input;

    if (!text || !time || !target) {
      throw new Error("Missing required fields: text, time, target");
    }

    const reminder = await createReminder({ text, time, target });

    return reminder;
  },
};
