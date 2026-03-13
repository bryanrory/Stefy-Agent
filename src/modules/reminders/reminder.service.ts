import { logger } from "../../config/logger";
import {
  createReminder as createReminderDB,
  getAllReminders,
  deleteReminder as deleteReminderDB,
} from "./reminder.model";
import { CreateReminderInput, Reminder } from "./reminder.types";
import { safeParseDateInput, PARSE_ERROR_MESSAGE } from "./dateParser";

export async function createReminder(input: CreateReminderInput): Promise<Reminder> {
  const parsed = safeParseDateInput(input.time);

  if (!parsed) {
    throw new Error(PARSE_ERROR_MESSAGE);
  }

  const isRecurring = !!parsed.repeat_type && parsed.repeat_type !== "once";

  const reminder = await createReminderDB({
    ...input,
    time: parsed.time,
    datetime: isRecurring ? null : parsed.datetime,
    repeat: input.repeat ?? isRecurring,
    repeat_type: (parsed.repeat_type as any) ?? input.repeat_type,
    repeat_value: parsed.repeat_value ?? input.repeat_value,
    repeat_days: parsed.repeat_days ?? input.repeat_days,
    repeat_interval: parsed.repeat_interval ?? input.repeat_interval,
    rrule: parsed.rrule ?? undefined,
    timezone: parsed.timezone,
    require_confirmation: input.require_confirmation ?? false,
  });

  logger.info({ reminder, triggersAt: parsed.datetime, repeatType: parsed.repeat_type, rrule: parsed.rrule }, "Reminder created");
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
