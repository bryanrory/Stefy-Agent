import { Tool, ToolContext } from "../tool.types";
import { createReminder } from "../../reminders/reminder.service";

export const createReminderTool: Tool = {
  name: "create_reminder",
  description: "Create a reminder. Pass the time as natural language in Portuguese or English (e.g. 'amanhã às 9', 'daqui 10 minutos', 'toda segunda às 8', '14:30').",
  inputSchema: {
    text: { type: "string", description: "Reminder text", required: true, example: "Take medicine" },
    time: { type: "string", description: "When: natural language (e.g. 'amanhã às 9', 'daqui 10 minutos', 'toda segunda às 8', '14:30', 'todo dia útil às 7')", required: true, example: "amanhã às 9" },
    require_confirmation: { type: "boolean", description: "If true, asks user to confirm after sending.", required: false, example: false },
  },

  async execute(input: { text: string; time: string; target?: string; require_confirmation?: boolean }, context?: ToolContext) {
    const { text, time } = input;

    if (!text || !time) {
      throw new Error("Missing required fields: text, time");
    }

    const target = input.target || context?.phone;

    if (!target) {
      throw new Error("Missing target phone number");
    }

    const reminder = await createReminder({
      text,
      time,
      target,
      user_id: context?.userId,
      require_confirmation: input.require_confirmation ?? false,
    });

    return reminder;
  },
};
