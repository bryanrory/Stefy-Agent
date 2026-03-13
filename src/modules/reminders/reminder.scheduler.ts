import cron from "node-cron";
import { logger } from "../../config/logger";
import { getActiveRemindersByTime, getDueReminders, getRecurringRemindersByTime, deactivateReminder, getUnconfirmedReminders, updateLastSentAt } from "./reminder.model";
import { getWhatsAppClient } from "../whatsapp/client";
import { Reminder } from "./reminder.types";

const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

export function shouldRunReminder(reminder: Reminder, now: Date): boolean {
  const type = reminder.repeat_type;
  if (!type || type === "once") return false;

  // Skip if already sent today
  if (reminder.last_sent_at) {
    const lastSent = new Date(reminder.last_sent_at);
    if (
      type !== "interval" &&
      lastSent.getFullYear() === now.getFullYear() &&
      lastSent.getMonth() === now.getMonth() &&
      lastSent.getDate() === now.getDate()
    ) {
      return false;
    }
  }

  const dayOfWeek = now.getDay(); // 0=sun, 6=sat
  const dayOfMonth = now.getDate();

  switch (type) {
    case "daily":
      return true;

    case "weekly": {
      if (reminder.repeat_days) {
        const days = reminder.repeat_days.toLowerCase().split(",").map(d => d.trim());
        const todayShort = DAY_NAMES[dayOfWeek].slice(0, 3);
        return days.includes(todayShort);
      }
      const targetDay = DAY_NAMES.indexOf((reminder.repeat_value ?? "").toLowerCase());
      return dayOfWeek === targetDay;
    }

    case "weekdays":
      return dayOfWeek >= 1 && dayOfWeek <= 5;

    case "monthly_day": {
      const targetDate = parseInt(reminder.repeat_value ?? "", 10);
      if (isNaN(targetDate)) return false;
      return dayOfMonth === targetDate;
    }

    case "monthly_last_day": {
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      return dayOfMonth === lastDay;
    }

    case "monthly_nth_weekday": {
      // repeat_value = "first_monday", "last_sunday", etc.
      const parts = (reminder.repeat_value ?? "").toLowerCase().split("_");
      if (parts.length !== 2) return false;
      const [position, weekday] = parts;
      const targetDayIdx = DAY_NAMES.indexOf(weekday);
      if (targetDayIdx === -1) return false;
      if (dayOfWeek !== targetDayIdx) return false;

      if (position === "first") {
        return dayOfMonth <= 7;
      } else if (position === "second") {
        return dayOfMonth > 7 && dayOfMonth <= 14;
      } else if (position === "third") {
        return dayOfMonth > 14 && dayOfMonth <= 21;
      } else if (position === "fourth") {
        return dayOfMonth > 21 && dayOfMonth <= 28;
      } else if (position === "last") {
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        return dayOfMonth > lastDay - 7;
      }
      return false;
    }

    case "interval": {
      const interval = reminder.repeat_interval ?? 1;
      if (!reminder.last_sent_at) return true;
      const lastSent = new Date(reminder.last_sent_at);
      const diffMs = now.getTime() - lastSent.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      return diffDays >= interval;
    }

    default:
      return false;
  }
}

async function sendReminder(reminder: Reminder): Promise<void> {
  const client = getWhatsAppClient();

  if (!client) {
    logger.warn({ id: reminder.id }, "WhatsApp not connected — skipping reminder");
    return;
  }

  const jid = `${reminder.target}@s.whatsapp.net`;

  try {
    if (reminder.require_confirmation) {
      await client.sendMessage(jid, { text: `⏰ Lembrete: ${reminder.text}\n\nVocê já fez isso? Responda *sim* para confirmar.` });
    } else {
      await client.sendMessage(jid, { text: `⏰ Lembrete: ${reminder.text}` });
    }
    logger.info({ id: reminder.id, target: reminder.target, text: reminder.text, requireConfirmation: reminder.require_confirmation }, "Reminder sent");
  } catch (err) {
    logger.error({ err, id: reminder.id }, "Failed to send reminder");
  }
}

export function startReminderScheduler(): void {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  logger.info({ timezone: tz, now: new Date().toISOString() }, "Reminder scheduler starting");

  cron.schedule("*/10 * * * * *", async () => {
    try {
      const now = new Date();
      logger.debug({ now: now.toISOString() }, "Scheduler tick");

      // Datetime-based reminders (one-time or relative)
      const dueReminders = await getDueReminders(now);
      if (dueReminders.length > 0) {
        logger.info({ count: dueReminders.length, ids: dueReminders.map(r => r.id) }, "Due reminders found");
      }
      for (const reminder of dueReminders) {
        await sendReminder(reminder);
        if (reminder.require_confirmation) {
          await updateLastSentAt(reminder.id, now);
          await deactivateReminder(reminder.id);
        } else if (!reminder.repeat) {
          await deactivateReminder(reminder.id);
        }
      }

      // HH:mm reminders — only check once per minute (first tick)
      if (now.getSeconds() < 10) {
        const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

        // Legacy HH:mm reminders (old repeat=true without repeat_type)
        const timeReminders = await getActiveRemindersByTime(currentTime);
        if (timeReminders.length > 0) {
          logger.info({ count: timeReminders.length, time: currentTime, ids: timeReminders.map(r => r.id) }, "Time reminders found");
        }
        for (const reminder of timeReminders) {
          await sendReminder(reminder);
          if (reminder.require_confirmation) {
            await updateLastSentAt(reminder.id, now);
            await deactivateReminder(reminder.id);
          } else if (!reminder.repeat) {
            await deactivateReminder(reminder.id);
          }
        }

        // Recurring reminders (new repeat_type system)
        const recurringReminders = await getRecurringRemindersByTime(currentTime);
        const dueRecurring = recurringReminders.filter(r => shouldRunReminder(r, now));
        if (dueRecurring.length > 0) {
          logger.info({ count: dueRecurring.length, time: currentTime, ids: dueRecurring.map(r => r.id) }, "Recurring reminders matched");
        }
        for (const reminder of dueRecurring) {
          await sendReminder(reminder);
          await updateLastSentAt(reminder.id, now);
          if (reminder.require_confirmation) {
            await deactivateReminder(reminder.id);
          }
        }
      }

      // Follow-up: re-send unconfirmed reminders every 5 minutes
      const unconfirmed = await getUnconfirmedReminders(now);
      if (unconfirmed.length > 0) {
        logger.info({ count: unconfirmed.length, ids: unconfirmed.map(r => r.id) }, "Unconfirmed reminders found — following up");
      }
      for (const reminder of unconfirmed) {
        await sendReminder(reminder);
        await updateLastSentAt(reminder.id, now);
      }
    } catch (err) {
      logger.error({ err }, "Scheduler tick failed");
    }
  });

  logger.info("Reminder scheduler started (every 10 seconds)");
}
