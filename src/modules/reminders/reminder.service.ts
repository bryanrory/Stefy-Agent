import { logger } from "../../config/logger";
import {
  createReminder as createReminderDB,
  getAllReminders,
  deleteReminder as deleteReminderDB,
} from "./reminder.model";
import { CreateReminderInput, Reminder } from "./reminder.types";
import { parseTimeInput } from "./timeParser";

export async function createReminder(input: CreateReminderInput): Promise<Reminder> {
  const isRecurring = input.repeat_type && input.repeat_type !== "once";

  // Recurring reminders use time (HH:mm) + recurrence rules, not datetime
  let datetime: Date | null = null;
  if (!isRecurring) {
    const parsed = parseTimeInput(input.time);
    datetime = parsed.datetime;
  }

  const reminder = await createReminderDB({
    ...input,
    time: input.time,
    datetime,
    repeat: input.repeat ?? !!isRecurring,
    require_confirmation: input.require_confirmation ?? false,
  });

  logger.info({ reminder, triggersAt: datetime, repeatType: input.repeat_type }, "Reminder created");
  return reminder;
}

export async function listReminders(userId?: number): Promise<Reminder[]> {
  return getAllReminders(userId);
}

export async function removeReminder(id: number, userId?: number): Promise<Reminder | null> {
  const removed = await deleteReminderDB(id, userId);
  if (removed) {
    logger.info({ id }, "Reminder removed");
  }
  return removed;
}
