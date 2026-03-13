import { Tool } from "../tool.types";
import { removeReminder } from "../../reminders/reminder.service";

export const deleteReminderTool: Tool = {
  name: "delete_reminder",
  description: "Delete a reminder by ID",

  async execute(input: { id: number }) {
    const { id } = input;

    if (id === undefined || id === null) {
      throw new Error("Missing required field: id");
    }

    const removed = await removeReminder(Number(id));

    if (!removed) {
      throw new Error(`Reminder with id ${id} not found`);
    }

    return removed;
  },
};
