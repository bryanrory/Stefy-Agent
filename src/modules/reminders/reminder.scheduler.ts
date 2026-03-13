import cron from "node-cron";
import { logger } from "../../config/logger";
import { getActiveRemindersByTime } from "./reminder.model";
import { getWhatsAppClient } from "../whatsapp/client";

export function startReminderScheduler(): void {
  cron.schedule("* * * * *", async () => {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const reminders = await getActiveRemindersByTime(currentTime);

    if (reminders.length === 0) return;

    const client = getWhatsAppClient();

    if (!client) {
      logger.warn("WhatsApp not connected — skipping reminders");
      return;
    }

    for (const reminder of reminders) {
      const jid = `${reminder.target}@s.whatsapp.net`;

      try {
        await client.sendMessage(jid, { text: `⏰ Lembrete: ${reminder.text}` });
        logger.info({ id: reminder.id, target: reminder.target, text: reminder.text }, "Reminder sent");
      } catch (err) {
        logger.error({ err, id: reminder.id }, "Failed to send reminder");
      }
    }
  });

  logger.info("Reminder scheduler started (every minute)");
}
