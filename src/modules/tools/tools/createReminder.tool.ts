import { Tool, ToolContext } from "../tool.types";
import { createReminder } from "../../reminders/reminder.service";

export const createReminderTool: Tool = {
  name: "create_reminder",
  description: "Create a reminder. Supports one-time, daily, weekly, weekdays, monthly, interval recurrence.",
  inputSchema: {
    text: { type: "string", description: "Reminder text", required: true, example: "Take medicine" },
    time: { type: "string", description: "Time: HH:mm (e.g. 08:30) or relative (e.g. 'in 5 minutes', 'in 1 hour')", required: true, example: "08:00" },
    repeat: { type: "boolean", description: "Legacy field. Set true for any recurring reminder.", required: false, example: false },
    require_confirmation: { type: "boolean", description: "If true, asks user to confirm after sending.", required: false, example: false },
    repeat_type: { type: "string", description: "Recurrence type: once, daily, weekly, weekdays, monthly_day, monthly_last_day, monthly_nth_weekday, interval. Default: once.", required: false, example: "once" },
    repeat_value: { type: "string", description: "Recurrence value. weekly: day name (monday). monthly_day: day number (10). monthly_nth_weekday: position_day (first_monday, last_sunday).", required: false, example: "monday" },
    repeat_days: { type: "string", description: "Comma-separated short day names for weekly with multiple days (mon,wed,fri).", required: false, example: "mon,wed,fri" },
    repeat_interval: { type: "number", description: "Number of days between reminders when repeat_type=interval.", required: false, example: 2 },
  },

  async execute(input: { text: string; time: string; target?: string; repeat?: boolean; require_confirmation?: boolean; repeat_type?: string; repeat_value?: string; repeat_days?: string; repeat_interval?: number }, context?: ToolContext) {
    const { text, time } = input;

    if (!text || !time) {
      throw new Error("Missing required fields: text, time");
    }

    const target = input.target || context?.phone;

    if (!target) {
      throw new Error("Missing target phone number");
    }

    const repeatType = (input.repeat_type as any) ?? undefined;
    const isRecurring = repeatType && repeatType !== "once";

    const reminder = await createReminder({
      text,
      time,
      target,
      user_id: context?.userId,
      repeat: input.repeat ?? !!isRecurring,
      require_confirmation: input.require_confirmation ?? false,
      repeat_type: repeatType,
      repeat_value: input.repeat_value,
      repeat_days: input.repeat_days,
      repeat_interval: input.repeat_interval,
    });

    return reminder;
  },
};
