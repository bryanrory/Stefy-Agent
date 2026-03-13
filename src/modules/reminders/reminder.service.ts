import { logger } from "../../config/logger";
import {
  createReminder as createReminderDB,
  getAllReminders,
  deleteReminder as deleteReminderDB,
} from "./reminder.model";
import { CreateReminderInput, Reminder } from "./reminder.types";

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export async function createReminder(input: CreateReminderInput): Promise<Reminder> {
  if (!TIME_REGEX.test(input.time)) {
    throw new Error("Invalid time format. Use HH:mm (e.g. 08:30)");
  }

  const reminder = await createReminderDB(input);
  logger.info({ reminder }, "Reminder created");
  return reminder;
}

export async function listReminders(): Promise<Reminder[]> {
  return getAllReminders();
}

export async function removeReminder(id: number): Promise<Reminder | null> {
  const removed = await deleteReminderDB(id);
  if (removed) {
    logger.info({ id }, "Reminder removed");
  }
  return removed;
}
